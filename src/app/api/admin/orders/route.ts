import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        "*, course:courses!orders_course_id_fkey(title,slug,base_price_cents,deposit_cents), session:sessions!orders_session_id_fkey(start_date,start_time,city,partner_id, partner:partners(name,city,state,country))"
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ data: orders ?? [] });
  } catch (err: any) {
    console.error("admin/orders GET error:", err?.message || err);
    return NextResponse.json({ data: [], warning: err?.message || "unknown error" }, { status: 200 });
  }
}
