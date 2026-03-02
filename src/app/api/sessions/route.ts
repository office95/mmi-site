import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
const TABLE = "sessions";

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      `
      id,status,course_id,partner_id,start_date,start_time,end_time,duration_hours,price_cents,deposit_cents,tax_rate,
      address,city,zip,state,
      courses (id,slug,title,hero_image_url),
      partners (id,name,address,zip,city,state)
    `
    )
    .order("start_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
