import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    // Orders roh laden
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (ordersError) throw ordersError;

    if (!orders || orders.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // IDs sammeln
    const courseIds = Array.from(new Set(orders.map((o) => o.course_id).filter(Boolean)));
    const sessionIds = Array.from(new Set(orders.map((o) => o.session_id).filter(Boolean)));

    // Kurse laden
    const { data: courses } = courseIds.length
      ? await supabase.from("courses").select("id,title,slug,base_price_cents,deposit_cents").in("id", courseIds)
      : { data: [] };
    const courseMap = new Map((courses ?? []).map((c: any) => [c.id, c]));

    // Sessions laden
    const { data: sessions } = sessionIds.length
      ? await supabase.from("sessions").select("id,start_date,start_time,city,partner_id").in("id", sessionIds)
      : { data: [] };
    const sessionMap = new Map((sessions ?? []).map((s: any) => [s.id, s]));

    // Partner laden
    const partnerIds = Array.from(new Set((sessions ?? []).map((s: any) => s.partner_id).filter(Boolean)));
    const { data: partners } = partnerIds.length
      ? await supabase.from("partners").select("id,name,city,state,country").in("id", partnerIds)
      : { data: [] };
    const partnerMap = new Map((partners ?? []).map((p: any) => [p.id, p]));

    // Anreichern
    const enriched = orders.map((o: any) => {
      const session = o.session_id ? sessionMap.get(o.session_id) : null;
      const partner = session?.partner_id ? partnerMap.get(session.partner_id) : null;
      return {
        ...o,
        course: o.course_id ? courseMap.get(o.course_id) || null : null,
        session: session ? { ...session, partner: partner || null } : null,
      };
    });

    return NextResponse.json({ data: enriched });
  } catch (err: any) {
    console.error("admin/orders GET error:", err?.message || err);
    return NextResponse.json({ data: [], warning: err?.message || "unknown error" }, { status: 200 });
  }
}
