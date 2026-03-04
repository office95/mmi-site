import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data: orders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!orders || orders.length === 0) return NextResponse.json({ data: [] });

  const courseIds = Array.from(new Set(orders.map((o) => o.course_id).filter(Boolean)));
  const sessionIds = Array.from(new Set(orders.map((o) => o.session_id).filter(Boolean)));

  const [coursesRes, sessionsRes] = await Promise.all([
    courseIds.length
      ? supabase.from("courses").select("id,title,slug,base_price_cents,deposit_cents").in("id", courseIds as string[])
      : Promise.resolve({ data: [] as any[], error: null }),
    sessionIds.length
      ? supabase.from("sessions").select("id,tax_rate,start_date,start_time,city,state,country").in("id", sessionIds as string[])
      : Promise.resolve({ data: [] as any[], error: null }),
  ]);

  if (coursesRes.error) return NextResponse.json({ error: coursesRes.error.message }, { status: 500 });
  if (sessionsRes.error) return NextResponse.json({ error: sessionsRes.error.message }, { status: 500 });

  const courseMap = new Map((coursesRes.data ?? []).map((c: any) => [c.id, c]));
  const sessionMap = new Map((sessionsRes.data ?? []).map((s: any) => [s.id, s]));

  const merged = orders.map((o) => ({
    ...o,
    course: o.course_id ? courseMap.get(o.course_id) ?? null : null,
    session: o.session_id ? sessionMap.get(o.session_id) ?? null : null,
  }));

  return NextResponse.json({ data: merged });
}
