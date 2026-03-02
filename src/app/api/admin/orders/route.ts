import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, created_at, status, amount_cents, deposit_cents, currency, email, customer_name, first_name, last_name,
       coupon_code, promotion_code, discount_amount_cents,
       session:sessions(id,tax_rate),
       course:courses(id,title,slug,base_price_cents,deposit_cents)`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
