import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServiceClient } from "@/lib/supabase";

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

async function generateOrderNumber(supabase: ReturnType<typeof getSupabaseServiceClient>) {
  const year = new Date().getFullYear();
  const yearShort = String(year).slice(-2);
  const prefix = `MMI-`;

  // Höchste vorhandene Nummer ermitteln und +1; Startwert 10000
  const { data } = await supabase
    .from("orders")
    .select("order_number")
    .ilike("order_number", `${prefix}%`)
    .order("order_number", { ascending: false })
    .limit(1);

  const last = data?.[0]?.order_number as string | undefined;
  let lastSeq = 9999;
  if (last && last.startsWith(prefix)) {
    // Format: MMI-12345-26
    const mid = last.replace(prefix, "").split("-")[0];
    const num = parseInt(mid, 10);
    if (!Number.isNaN(num)) lastSeq = num;
  }
  const next = lastSeq + 1;
  return `${prefix}${next}-${yearShort}`;
}

// Use current Stripe typed apiVersion literal to satisfy SDK typings
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2026-02-25.clover" }) : null;

export async function POST(request: Request) {
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
    .select(
      "id, start_date, start_time, city, price_cents, deposit_cents, max_participants, seats_taken, course_id, courses ( id, title, slug, base_price_cents, deposit_cents )"
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionErr || !sessionRow) {
    return NextResponse.json({ error: "Kurstermin nicht gefunden" }, { status: 404 });
  }

  const course = Array.isArray(sessionRow.courses) ? sessionRow.courses[0] : sessionRow.courses;
  if (!course) {
    return NextResponse.json({ error: "Kurs zum Termin fehlt" }, { status: 400 });
  }

  const priceCents = sessionRow.price_cents ?? course.base_price_cents;
  const depositCents = sessionRow.deposit_cents ?? course.deposit_cents ?? null;

  if (!priceCents) {
    return NextResponse.json({ error: "Kein Preis für diesen Termin hinterlegt" }, { status: 400 });
  }

  const chargeCents = (depositCents ?? priceCents) * participants;

  // Kapazität prüfen
  if (sessionRow.max_participants && (sessionRow.seats_taken ?? 0) + participants > sessionRow.max_participants) {
    return NextResponse.json({ error: "Keine Plätze mehr frei" }, { status: 409 });
  }

  const orderNumber = await generateOrderNumber(supabase);

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
      amount_cents: chargeCents,
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
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      allow_promotion_codes: true,
      line_items: [
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
      ],
      metadata: {
        order_id: orderInsert.id,
        session_id: sessionRow.id,
        course_id: course.id,
        participants: String(participants),
        price_mode: depositCents ? "deposit" : "full",
        order_number: orderNumber,
        coupon_code: coupon_code || "",
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
