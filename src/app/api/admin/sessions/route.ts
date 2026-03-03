// src/app/api/admin/sessions/route.ts
import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getRegionFromRequest } from "@/lib/region-request";

const TABLE = "sessions";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const region = getRegionFromRequest(req);
  const showAll = req.nextUrl.searchParams.get("all") === "1";

  // 1) Sessions laden
  const { data: sessions, error: errSes } = await supabase
    .from(TABLE)
    .select("*")
    .or(showAll ? undefined : `region.eq.${region},region.eq.${region.toLowerCase()},region.is.null,region.eq.`)
    .order("start_date", { ascending: true });
  if (errSes) return NextResponse.json({ error: errSes.message }, { status: 500 });
  if (!sessions || sessions.length === 0) return NextResponse.json({ data: [] });

  // 2) Kurse nachladen
  const courseIds = Array.from(
    new Set((sessions as { course_id?: string | null }[]).map((s) => s.course_id).filter(Boolean))
  );
  let coursesMap: Record<string, { id: string; slug: string; title: string; hero_image_url?: string | null }> = {};
  if (courseIds.length) {
    const { data: courses, error: errC } = await supabase
      .from("courses")
      .select("id,slug,title,hero_image_url,type_id,category_id,region")
      .or(`region.eq.${region},region.eq.${region.toLowerCase()},region.is.null,region.eq.`)
      .in("id", courseIds);
    if (errC) return NextResponse.json({ error: errC.message }, { status: 500 });
    coursesMap = Object.fromEntries((courses ?? []).map((c) => [c.id, c]));
  }

  // 3) Partner nachladen (nur sichere Felder)
  const partnerIds = Array.from(
    new Set((sessions as { partner_id?: string | null }[]).map((s) => s.partner_id).filter(Boolean))
  );
  let partnersMap: Record<string, { id: string; name?: string | null; city?: string | null; state?: string | null; country?: string | null }> =
    {};
  if (partnerIds.length) {
    const { data: partners, error: errP } = await supabase
      .from("partners")
      .select("id,name,city,state,country,region")
      .or(`region.eq.${region},region.eq.${region.toLowerCase()},region.is.null,region.eq.`)
      .in("id", partnerIds);
    if (errP) return NextResponse.json({ error: errP.message }, { status: 500 });
    partnersMap = Object.fromEntries((partners ?? []).map((p) => [p.id, p]));
  }

  const enriched = sessions.map((s) => ({
    ...s,
    course: coursesMap[s.course_id ?? ""] ?? null,
    partners: partnersMap[s.partner_id ?? ""] ?? null,
  }));

  return NextResponse.json({ data: enriched });
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = getSupabaseServiceClient();

  const id = body.id ?? randomUUID();
  if (!body.start_date) {
    return NextResponse.json({ error: "start_date ist erforderlich" }, { status: 400 });
  }

  const payload = {
    id,
    course_id: body.course_id ?? null,
    partner_id: body.partner_id ?? null,
    start_date: body.start_date ?? null,
    start_time: body.start_time ?? null,
    end_time: body.end_time ?? null,
    city: body.city ?? null,
    address: body.address ?? null,
    price_cents: body.price_cents ?? null,
    deposit_cents: body.deposit_cents ?? null,
    max_participants: body.max_participants ?? null,
    seats_taken: body.seats_taken ?? 0,
    status: body.status ?? "active",
    duration_hours: body.duration_hours ?? null,
    price_label: body.price_label ?? null,
    tax_rate: body.tax_rate ?? null,
    category_id: body.category_id ?? null,
    format_id: body.format_id ?? null,
    language_id: body.language_id ?? null,
    min_participants: body.min_participants ?? null,
    tags: body.tags ?? [],
    zip: body.zip ?? null,
    state: body.state ?? null,
    created_at: body.created_at ?? undefined,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from(TABLE).upsert(payload, { onConflict: "id" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
