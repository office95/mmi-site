import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { generateOrderNumber } from "@/lib/orderNumber";

type CheckoutBody = {
  sessionId?: string;
  courseId?: string;
  email?: string;
  customer_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  dob?: string;
  company_name?: string;
  company_uid?: string;
  coupon_code?: string | null;
  is_company?: boolean;
  consent_gdpr?: boolean;
  participants?: number;
};

const stripeSecret = process.env.STRIPE_SECRET_KEY;

// Simple in-memory rate limit (per instance). For production, replace with Redis/Upstash.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;
const rateBucket = new Map<string, number[]>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateBucket.get(ip) || []).filter((t) => t >= windowStart);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateBucket.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  rateBucket.set(ip, timestamps);
  return false;
}

// Use SDK default API version
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export async function POST(request: Request) {
  const ipHeader = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const clientIp = ipHeader.split(",")[0].trim() || "unknown";

  if (isRateLimited(clientIp)) {
    return NextResponse.json({ error: "Zu viele Anfragen, bitte kurz warten." }, { status: 429 });
  }

  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request" }, { status: 400 });
  }

  const {
    sessionId,
    email,
    customer_name,
    first_name,
    last_name,
    phone,
    street,
    zip,
    city,
    country,
    dob,
    company_name,
    company_uid,
    coupon_code,
    is_company = false,
    consent_gdpr = false,
    participants = 1,
  } = body;
  if (!sessionId || !email) {
    return NextResponse.json({ error: "sessionId und email sind erforderlich" }, { status: 400 });
  }
  if (!consent_gdpr) {
    return NextResponse.json({ error: "Bitte der Datenschutzerklärung zustimmen" }, { status: 400 });
  }
  if (participants < 1) {
    return NextResponse.json({ error: "Teilnehmer muss >= 1 sein" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { data: sessionRow, error: sessionErr } = await supabase
    .from("sessions")
    .select("*, courses ( id, title, slug, base_price_cents, deposit_cents )")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionErr || !sessionRow) {
    console.error("checkout: session lookup failed", {
      sessionId,
      error: sessionErr?.message,
      supabase: sessionErr,
    });
    return NextResponse.json({ error: "Kurstermin nicht gefunden" }, { status: 404 });
  }

  const course = Array.isArray(sessionRow.courses) ? sessionRow.courses[0] : sessionRow.courses;
  if (!course) {
    return NextResponse.json({ error: "Kurs zum Termin fehlt" }, { status: 400 });
  }

  const priceCents = sessionRow.price_cents ?? course.base_price_cents;
  const depositCents = sessionRow.deposit_cents ?? course.deposit_cents ?? null;
  const addonIds: string[] = Array.isArray(body.addons) ? body.addons.filter((id: any) => typeof id === "string") : [];
  let addonSum = 0;
  let addonRows: { id: string; name: string; price_cents: number }[] = [];
  if (addonIds.length) {
    const { data: addonData, error: addonErr } = await supabase.from("addons").select("id,name,price_cents").in("id", addonIds);
    if (addonErr) return NextResponse.json({ error: addonErr.message }, { status: 500 });
    addonRows = (addonData || []).map((a) => ({ id: a.id, name: a.name, price_cents: a.price_cents ?? 0 }));
    addonSum = addonRows.reduce((sum, a) => sum + a.price_cents, 0);
  }

  if (!priceCents) {
    return NextResponse.json({ error: "Kein Preis für diesen Termin hinterlegt" }, { status: 400 });
  }

  const chargeCents = (depositCents ?? priceCents) * participants + addonSum;

  // Kapazität prüfen
  if (sessionRow.max_participants && (sessionRow.seats_taken ?? 0) + participants > sessionRow.max_participants) {
    return NextResponse.json({ error: "Keine Plätze mehr frei" }, { status: 409 });
  }

  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const originHeader = request.headers.get("origin") || "";
  const domainSource = (hostHeader || originHeader).toLowerCase();
  const hostname = domainSource.split("://").pop()?.split(":")[0] || "";
  const regionSuffix = hostname.endsWith("musicmission.at")
    ? "AT"
    : hostname.endsWith("musicmission.de")
      ? "DE"
      : undefined;

  const orderNumber = await generateOrderNumber({ supabase, regionSuffix });

  const { data: orderInsert, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      course_id: course.id,
      session_id: sessionRow.id,
      email,
      customer_name: customer_name || null,
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone || null,
      street: street || null,
      zip: zip || null,
      city: city || null,
      country: country || null,
      dob: dob || null,
      company_name: is_company ? company_name || null : null,
      company_uid: is_company ? company_uid || null : null,
      coupon_code: coupon_code || null,
      is_company,
      consent_gdpr: !!consent_gdpr,
      amount_cents: (priceCents * participants) + addonSum,
      deposit_cents: depositCents ?? null,
      currency: "EUR",
      status: stripe ? "pending" : "paid",
      participants,
    })
    .select("id, order_number")
    .single();

  if (orderErr || !orderInsert) {
    return NextResponse.json({ error: orderErr?.message || "Bestellung konnte nicht angelegt werden" }, { status: 500 });
  }

  // Base URL dynamisch aus Host (Fallback auf https)
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const proto = (request.headers.get("x-forwarded-proto") || "").includes("http") ? request.headers.get("x-forwarded-proto")! : "https";
  const baseUrl = `${proto}://${host}`.replace(/\/+$/, "");
  const successUrl = `${baseUrl}/buchen/success?course=${course.slug}&order=${orderInsert.id}`;
  const cancelUrl = `${baseUrl}/buchen/cancel?course=${course.slug}`;

  // Wenn kein Stripe-Key vorhanden → klarer Fehler
  if (!stripe) {
    return NextResponse.json({ error: "Stripe ist nicht konfiguriert (STRIPE_SECRET_KEY fehlt)" }, { status: 500 });
  }

  try {
    let partner: { name?: string | null; zip?: string | null; city?: string | null; state?: string | null } | null = null;
    if (sessionRow.partner_id) {
      const pRes = await supabase.from("partners").select("name,zip,city,state").eq("id", sessionRow.partner_id).maybeSingle();
      partner = pRes.data || null;
    }

    if (addonRows.length) {
      const addonInserts = addonRows.map((a) => ({
        order_id: orderInsert.id,
        addon_id: a.id,
        price_cents: a.price_cents,
      }));
      await supabase.from("order_addons").insert(addonInserts);
    }

    const lineItems: any[] = [
      {
        quantity: participants,
        price_data: {
          currency: "eur",
          unit_amount: depositCents ?? priceCents,
          product_data: {
            name: course.title,
            description: sessionRow.city ? `Termin in ${sessionRow.city}` : "Kurstermin",
          },
        },
      },
    ];
    if (addonRows.length) {
      addonRows.forEach((a) => {
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: a.price_cents,
            product_data: {
              name: `Add-on: ${a.name}`,
            },
          },
        });
      });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      allow_promotion_codes: true,
      line_items: lineItems,
      metadata: {
        order_id: orderInsert.id,
        session_id: sessionRow.id,
        course_id: course.id,
        participants: String(participants),
        price_mode: depositCents ? "deposit" : "full",
        order_number: orderNumber,
        region_suffix: regionSuffix || "",
        coupon_code: coupon_code || "",
        start_date: sessionRow.start_date || "",
        start_time: sessionRow.start_time || "",
        partner_name: partner?.name || "",
        zip: partner?.zip || sessionRow.zip || "",
        city: partner?.city || sessionRow.city || "",
        state: partner?.state || sessionRow.state || "",
        addons: addonRows.map((a) => a.id).join(","),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    await supabase
      .from("orders")
      .update({ checkout_session_id: checkout.id })
      .eq("id", orderInsert.id);

    return NextResponse.json({ url: checkout.url });
  } catch (err: any) {
    // Stripe-Fehler -> Order wieder aufräumen
    await supabase.from("orders").delete().eq("id", orderInsert.id);
    return NextResponse.json({ error: err.message || "Stripe-Fehler" }, { status: 500 });
  }
}
