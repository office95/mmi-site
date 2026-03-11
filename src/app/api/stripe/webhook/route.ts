import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { sendMail } from "@/lib/mail";
import { syncOrderToZoho } from "@/lib/zohoSyncOrder";

export const dynamic = "force-dynamic";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
// Verwende die Stripe-Standard-API-Version der verwendeten SDK-Version.
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export async function POST(req: Request) {
  if (!stripe || !webhookSecret) return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 500 });

  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    console.warn(`[stripe-webhook] fehlende Signatur`, { ip });
    return NextResponse.json({ error: "Keine Signatur" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: unknown) {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const message = err instanceof Error ? err.message : "unknown";
    console.warn(`[stripe-webhook] ungültige Signatur`, { ip, message });
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const cs = event.data.object as Stripe.Checkout.Session;
    const sessionId = cs.metadata?.session_id;
    const courseId = cs.metadata?.course_id;
    const participants = Number(cs.metadata?.participants ?? 1);
    const priceMode = cs.metadata?.price_mode ?? "deposit";

    // Rabatt / Promotion-Code ermitteln
    const discountEntry = cs.total_details?.breakdown?.discounts?.[0] as { discount?: { id?: string; promotion_code?: string; coupon?: { name?: string } } } | undefined;
    const discountObj = discountEntry?.discount;
    const discountId = discountObj?.id ?? null; // di_...
    const promoId = discountObj?.promotion_code ?? null; // promo_...
    const discountAmount = cs.total_details?.amount_discount ?? null;

    let promoCode: string | null = null;
    let couponCode: string | null = cs.metadata?.coupon_code || null;

    // 1) Wenn promotion_code vorhanden: PromotionCode laden -> code
    if (!promoCode && promoId && stripe) {
      try {
        const promo = await stripe.promotionCodes.retrieve(promoId);
        promoCode = promo?.code || null;
      } catch (_) {
        /* ignore */
      }
    }

    // 2) Falls nur Discount-ID vorhanden: Discount laden und PromotionCode daraus ziehen
    if (!promoCode && discountId && stripe) {
      try {
        const disc = await (stripe as Stripe & { discounts: { retrieve: (id: string) => Promise<{ promotion_code?: string }> } }).discounts.retrieve(discountId);
        const promoFromDisc = disc?.promotion_code;
        if (promoFromDisc) {
          const pc = await (stripe as Stripe & { promotionCodes: { retrieve: (id: string) => Promise<{ code?: string }> } }).promotionCodes.retrieve(promoFromDisc);
          promoCode = pc?.code || promoCode;
        }
      } catch (_) {
        /* ignore */
      }
    }

    // 3) Falls Coupon-Name vorhanden (nur Name, kein Code), als Fallback
    if (!promoCode && discountObj?.coupon?.name) {
      promoCode = discountObj.coupon.name as string;
    }

    // 4) Metadata-Fallback
    if (!promoCode && cs.metadata?.promotion_code) promoCode = cs.metadata.promotion_code as string;
    if (!couponCode && promoCode) couponCode = promoCode;

    const supabase = getSupabaseServiceClient();

    const [courseRow, sessionRow] = await Promise.all([
      courseId ? supabase.from("courses").select("title,tax_rate,zoho_item_id").eq("id", courseId).maybeSingle() : Promise.resolve({ data: null }),
      sessionId
        ? supabase
            .from("sessions")
            .select("id,title,start_date,start_time,partner_id,city,state,country,address,zip,tax_rate,zoho_item_id")
            .eq("id", sessionId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    // Order aktualisieren, falls bereits angelegt (checkout-Route), sonst neu erstellen
    const payload = {
      session_id: sessionId,
      course_id: courseId,
      email: cs.customer_details?.email ?? null,
      amount_cents: cs.amount_total,
      currency: cs.currency?.toUpperCase() ?? "EUR",
      status: "paid",
      participants,
      checkout_session_id: cs.id,
      stripe_payment_intent: cs.payment_intent ?? null,
      notes: priceMode,
      coupon_code: couponCode,
      promotion_code: promoCode || couponCode || promoId,
      discount_amount_cents: discountAmount,
    };

    if (cs.metadata?.order_id) {
      await supabase.from("orders").update(payload).eq("id", cs.metadata.order_id);
    } else {
      // Falls keine Order vorab angelegt wurde, Insert anlegen
      await supabase.from("orders").insert(payload);
    }

    // Sitzplätze erhöhen
    if (sessionId) {
      await supabase.rpc("increment_seats", { p_session_id: sessionId, p_count: participants });
    }

    // Zoho Books: Rechnung erstellen (zentral via syncOrderToZoho)
    try {
      const orderId = cs.metadata?.order_id;
      if (!orderId) {
        console.warn("[webhook] missing order_id for Zoho sync", { checkout_session: cs.id });
      } else {
        await syncOrderToZoho(orderId);
        await supabase.from("orders").update({ zoho_sync_status: "synced", zoho_sync_error: null }).eq("id", orderId);
      }
    } catch (err: any) {
      const msg = err?.message || "Zoho sync failed";
      if (cs.metadata?.order_id) {
        await supabase.from("orders").update({ zoho_sync_status: "failed", zoho_sync_error: msg }).eq("id", cs.metadata.order_id);
      }
      console.error("Zoho sync failed", err);
    }

// Benachrichtigung per E-Mail
    const partnerRow =
      sessionRow?.data?.partner_id &&
      (await supabase
        .from("partners")
        .select("name,city,state,country,street,zip,address")
        .eq("id", sessionRow.data.partner_id)
        .maybeSingle());

    const formatDate = (d?: string | null) => (d ? new Date(d + "T00:00:00").toLocaleDateString("de-AT") : "n/a");
    const formatTime = (t?: string | null) => (t ? t.substring(0, 5) : "n/a");

    const adminBase = process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at";
    const orderLink =
      cs.metadata?.order_id || cs.metadata?.order_number
        ? `${adminBase}/admin/orders/${cs.metadata?.order_id ?? ""}`
        : `${adminBase}/admin/orders`;

    const customerPhone = cs.customer_details?.phone || cs.metadata?.phone || cs.metadata?.customer_phone || "";
    const html = `
      <h3>Du hast eine neue Buchung</h3>
      <p><strong>Kurs:</strong> ${courseRow?.data?.title ?? "n/a"}</p>
      <p><strong>Termin:</strong> ${formatDate(sessionRow?.data?.start_date)} ${formatTime(sessionRow?.data?.start_time)}</p>
      <p><strong>Partner:</strong> ${partnerRow?.data?.name ?? "n/a"} (${partnerRow?.data?.city ?? sessionRow?.data?.city ?? ""})</p>
      <p><strong>Teilnehmer (Anzahl):</strong> ${participants}</p>
      <p><strong>Kursteilnehmer:</strong> ${cs.customer_details?.name ?? "n/a"} ${customerPhone ? "· " + customerPhone : ""} (${cs.customer_details?.email ?? ""})</p>
      <p><strong>Order:</strong> ${cs.metadata?.order_number ?? "—"}</p>
      <p><a href="${orderLink}" target="_blank" rel="noreferrer">Zur Bestellung</a></p>
    `;
    try {
      await sendMail({
        to: "office@musicmission.at",
        subject: "Du hast eine neue Buchung",
        html,
      });
    } catch (err) {
      console.error("E-Mail Versand fehlgeschlagen", err);
      // Webhook trotzdem erfolgreich quittieren, damit Stripe nicht neu sendet
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const meta = pi.metadata || {};
    const orderId = meta.order_id;
    if (orderId) {
      const supabase = getSupabaseServiceClient();
      await supabase
        .from("orders")
        .update({
          status: "paid",
          stripe_payment_intent: pi.id,
          amount_cents: pi.amount_received ?? pi.amount ?? null,
        })
        .eq("id", orderId);
    }
  }

  // Kundenbestätigung
  try {
    const customerEmail =
      event.type === "checkout.session.completed"
        ? (event.data.object as Stripe.Checkout.Session).customer_details?.email ?? null
        : null;
    if (customerEmail) {
      const cs = event.data.object as Stripe.Checkout.Session;
      const courseTitle = cs.metadata?.course_title || "";
      const startDate = cs.metadata?.start_date || "";
      const partnerName = cs.metadata?.partner_name || "";
      const partnerAddress = cs.metadata?.partner_address || "";

      const htmlCustomer = `
        <p>Hallo,</p>
        <p>vielen Dank für deine Buchung beim Music Mission Institute.<br/>Dein Platz im Kurs ist fix reserviert.</p>
        <p>${courseTitle ? `<strong>Kurs:</strong> ${courseTitle}<br/>` : ""}${startDate ? `<strong>Termin:</strong> ${startDate}<br/>` : ""}${partnerName ? `<strong>Ort:</strong> ${partnerName}${partnerAddress ? ", " + partnerAddress : ""}<br/>` : ""}</p>
        <p>Weitere Infos erhältst du rechtzeitig vor Kursbeginn.</p>
        <p>Wir freuen uns auf dich!</p>
        <p>Beste Grüße<br/>Music Mission Institute<br/>www.musicmission.at</p>
      `;
      await sendMail({
        to: customerEmail,
        subject: "Bestätigung deiner Kursbuchung",
        html: htmlCustomer,
      });
    }
  } catch (err) {
    console.error("Customer mail failed", err);
  }

  return NextResponse.json({ received: true });
}
