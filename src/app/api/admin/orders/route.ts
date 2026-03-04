import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: orders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    if (!orders || orders.length === 0) return NextResponse.json({ data: [] });

    const courseIds = Array.from(new Set(orders.map((o) => (o as any).course_id).filter(Boolean)));
    const sessionIds = Array.from(new Set(orders.map((o) => (o as any).session_id).filter(Boolean)));

    const [coursesRes, sessionsRes] = await Promise.all([
      courseIds.length
        ? supabase.from("courses").select("id,title,slug,base_price_cents,deposit_cents").in("id", courseIds as string[])
        : Promise.resolve({ data: [] as any[], error: null }),
      sessionIds.length
        ? supabase.from("sessions").select("id,tax_rate,start_date,start_time,city,state,country").in("id", sessionIds as string[])
        : Promise.resolve({ data: [] as any[], error: null }),
    ]);

    if (coursesRes.error) throw coursesRes.error;
    if (sessionsRes.error) throw sessionsRes.error;

    const courseMap = new Map((coursesRes.data ?? []).map((c: any) => [c.id, c]));
    const sessionMap = new Map((sessionsRes.data ?? []).map((s: any) => [s.id, s]));

    const merged = orders.map((o) => ({
      ...o,
      course: (o as any).course_id ? courseMap.get((o as any).course_id) ?? null : null,
      session: (o as any).session_id ? sessionMap.get((o as any).session_id) ?? null : null,
    }));

    return NextResponse.json({ data: merged });
  } catch (err: any) {
    console.error("admin/orders GET error:", err?.message || err);
    return NextResponse.json({ data: [], warning: err?.message || "unknown error" }, { status: 200 });
  }
}
