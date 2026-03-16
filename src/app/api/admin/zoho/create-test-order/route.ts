import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { generateOrderNumber } from "@/lib/orderNumber";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev) return NextResponse.json({ error: "Only allowed in dev" }, { status: 403 });
  if (!serviceKey) return NextResponse.json({ error: "Service role key missing" }, { status: 500 });
  const auth = req.headers.get("x-service-role-key");
  if (!isDev && auth !== serviceKey) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseServiceClient();

  const body = (await req.json().catch(() => ({}))) as Partial<{
    course_id: string;
    session_id: string;
    email: string;
    customer_name: string;
    first_name: string;
    last_name: string;
    street: string;
    zip: string;
    city: string;
    country: string;
    phone: string;
    dob: string;
    amount_cents: number;
  }>;

  // Feste Default-Session (hat Startdatum + Partner): aus CSV geprüft
  const DEFAULT_SESSION_ID = "10fb0cb1-33ba-42c5-b410-42b2a6ac4cc8";
  const DEFAULT_COURSE_ID = "e25ed589-90c0-4bb2-a9f8-33b3a598ce41";

  let courseId = body.course_id || DEFAULT_COURSE_ID;
  let sessionId = body.session_id || DEFAULT_SESSION_ID;

  const order_number = await generateOrderNumber({ supabase });

  const payload = {
    course_id: courseId,
    session_id: sessionId || "2aed3813-c455-4fd1-8d45-63ed8c6b9332",
    email: body.email || "zoho-test@example.com",
    customer_name: body.customer_name || "Zoho Test",
    first_name: body.first_name || "Zoho",
    last_name: body.last_name || "Test",
    street: body.street || "Testweg 5",
    zip: body.zip || "1010",
    city: body.city || "Wien",
    country: body.country || "Österreich",
    phone: body.phone || "+431234567",
    dob: body.dob || "1990-01-01",
    amount_cents: body.amount_cents ?? 39900,
    deposit_cents: body.amount_cents ?? 39900,
    currency: "EUR",
    status: "paid" as const,
    participants: 1,
    order_number,
    stripe_payment_intent: "pi_test_local",
    zoho_invoice_id: null,
  };

  const { data, error } = await supabase.from("orders").insert(payload).select("id,order_number").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, order: data });
}
