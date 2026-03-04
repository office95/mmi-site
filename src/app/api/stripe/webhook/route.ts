import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { sendMail } from "@/lib/mail";

export const dynamic = "force-dynamic";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2026-02-25.clover" }) : null;

export async function POST(req: Request) {
  if (!stripe || !webhookSecret) return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 500 });

  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Keine Signatur" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const cs = event.data.object as Stripe.Checkout.Session;
    const sessionId = cs.metadata?.session_id;
    const courseId = cs.metadata?.course_id;
    const participants = Number(cs.metadata?.participants ?? 1);
    const priceMode = cs.metadata?.price_mode ?? "deposit";

    // Rabatt / Promotion-Code ermitteln
    const discountEntry: any = cs.total_details?.breakdown?.discounts?.[0] ?? null;
    const discountObj: any = discountEntry?.discount ?? null;
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
        const disc = await (stripe as any).discounts.retrieve(discountId);
        const promoFromDisc = (disc as any)?.promotion_code as string | undefined;
        if (promoFromDisc) {
          const pc = await (stripe as any).promotionCodes.retrieve(promoFromDisc);
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

    // Order aktualisieren, falls bereits angelegt (checkout-Route), sonst neu erstellen
    const payload = {
      session_id: sessionId,
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

    // Benachrichtigung per E-Mail
    const [courseRow, sessionRow] = await Promise.all([
      courseId ? supabase.from("courses").select("title").eq("id", courseId).maybeSingle() : Promise.resolve({ data: null }),
      sessionId
        ? supabase
            .from("sessions")
            .select("start_date,start_time,partner_id,city,state,country")
            .eq("id", sessionId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const partnerRow =
      sessionRow?.data?.partner_id &&
      (await supabase.from("partners").select("name,city,state,country").eq("id", sessionRow.data.partner_id).maybeSingle());

    const formatDate = (d?: string | null) => (d ? new Date(d + "T00:00:00").toLocaleDateString("de-AT") : "n/a");
    const formatTime = (t?: string | null) => (t ? t.substring(0, 5) : "n/a");

    const html = `
      <h3>Du hast eine neue Buchung</h3>
      <p><strong>Kurs:</strong> ${courseRow?.data?.title ?? "n/a"}</p>
      <p><strong>Termin:</strong> ${formatDate(sessionRow?.data?.start_date)} ${formatTime(sessionRow?.data?.start_time)}</p>
      <p><strong>Partner:</strong> ${partnerRow?.data?.name ?? "n/a"} (${partnerRow?.data?.city ?? sessionRow?.data?.city ?? ""})</p>
      <p><strong>Teilnehmer:</strong> ${participants}</p>
      <p><strong>Order:</strong> ${cs.metadata?.order_number ?? "—"}</p>
      <p><strong>Kunde:</strong> ${cs.customer_details?.name ?? ""} (${cs.customer_details?.email ?? ""})</p>
    `;
    await sendMail({
      to: "office@musicmission.at",
      subject: "Neue Kursbuchung",
      html,
    });
  }

  return NextResponse.json({ received: true });
}
