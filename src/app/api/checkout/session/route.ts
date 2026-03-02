import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005";
const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  console.warn("[stripe] STRIPE_SECRET_KEY fehlt – Checkout-Route deaktiviert");
}
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2026-02-25.clover" }) : null;

export async function POST(req: Request) {
  if (!stripe) return NextResponse.json({ error: "Stripe nicht konfiguriert" }, { status: 500 });

  const supabase = getSupabaseServiceClient();
  const body = await req.json();
  const { sessionId, participants = 1, mode = "deposit" } = body as {
    sessionId?: string;
    participants?: number;
    mode?: "deposit" | "full";
  };

  if (!sessionId) return NextResponse.json({ error: "sessionId fehlt" }, { status: 400 });

  // Session + Course laden
  const { data: ses, error } = await supabase
    .from("sessions")
    .select(
      "id,start_date,start_time,city,course:course_id(id,title,slug,base_price_cents,deposit_cents)"
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !ses) return NextResponse.json({ error: "Termin nicht gefunden" }, { status: 404 });

  const course = (ses as any).course;
  const amount =
    mode === "deposit"
      ? course?.deposit_cents ?? course?.base_price_cents
      : course?.base_price_cents ?? course?.deposit_cents;

  if (!amount) return NextResponse.json({ error: "Preis fehlt" }, { status: 400 });

  const descParts = [];
  if (ses.start_date) descParts.push(`Start: ${ses.start_date}`);
  if (ses.city) descParts.push(ses.city);
  const description = descParts.join(" • ");

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: participants,
        price_data: {
          currency: "eur",
          unit_amount: amount,
          product_data: {
            name: course?.title ?? "Kurs",
            description: description || undefined,
          },
        },
      },
    ],
    success_url: `${siteUrl}/buchen/success?cs={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/buchen/cancel`,
    metadata: {
      session_id: ses.id,
      course_id: course?.id ?? "",
      participants: String(participants),
      price_mode: mode,
    },
  });

  return NextResponse.json({ url: checkout.url });
}
