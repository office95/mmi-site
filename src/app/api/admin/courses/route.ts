/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getRegionFromRequest } from "@/lib/region-request";

const TABLE = "courses";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const region = getRegionFromRequest(req);
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*, sessions(*), addons(*), course_tags(tag:tags(name))")
    .or(`region.eq.${region},region.eq.${region.toLowerCase()},region.is.null,region.eq.`)
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const mapped =
    data?.map((c: any) => ({
      ...c,
      tags: ((c.course_tags ?? []).map((t: any) => t.tag?.name).filter(Boolean) ?? []).concat(c.tags ?? []).filter(Boolean),
      sessions: c.sessions ?? [],
      addons: c.addons ?? [],
    })) ?? [];
  return NextResponse.json({ data: mapped });
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = getSupabaseServiceClient();

  const courseId = body.id ?? randomUUID();

  const payload = {
    id: courseId,
    status: body.status ?? "active",
    title: body.title,
    slug: body.slug || body.title?.toLowerCase().replace(/\s+/g, "-"),
    tags: Array.isArray(body.tags) ? body.tags.filter((t: string) => !!t?.trim()) : [],
    region: body.region ?? null,
    category_id: body.category_id ?? null,
    subcategory_id: body.subcategory_id ?? null,
    type_id: body.type_id ?? null,
    format_id: body.format_id ?? null,
    level_id: body.level_id ?? null,
    subtitle: body.subtitle ?? null,
    key_facts: body.key_facts ?? [],
  audience: body.audience ?? null,
  content: body.content ?? null,
  hero_image_url: body.hero_image_url ?? null,
  hero_image_mobile_url: body.hero_image_mobile_url ?? null,
  slogan_image_url: body.slogan_image_url ?? null,
  slogan_image_mobile_url: body.slogan_image_mobile_url ?? null,
  slogan_line1: body.slogan_line1 ?? null,
  slogan_line2: body.slogan_line2 ?? null,
  slogan_line3: body.slogan_line3 ?? null,
    summary: body.summary ?? null,
    description: body.description ?? null,
    base_price_cents: body.base_price_cents ?? 0,
    deposit_cents: body.deposit_cents ?? null,
    tax_rate: body.tax_rate ?? null,
    max_participants: body.max_participants ?? null,
    duration_hours: body.duration_hours ?? null,
    language: body.language ?? "de",
    price_tiers: body.price_tiers ?? [], // optional array of {label, price_cents, deposit_cents, tax_rate}
    updated_at: new Date().toISOString(),
  };

  const { data: courseData, error: courseError } = await supabase.from(TABLE).upsert(payload, { onConflict: "id" }).select().single();
  if (courseError) return NextResponse.json({ error: courseError.message }, { status: 500 });

  // Tags
  if (Array.isArray(body.tags)) {
    const tagNames: string[] = body.tags.filter((t: string) => !!t?.trim());
    const tagIds: number[] = [];
    if (tagNames.length) {
      const { data: tagsRows, error: tagErr } = await supabase
        .from("tags")
        .upsert(tagNames.map((name) => ({ name })), { onConflict: "name" })
        .select();
      if (tagErr) return NextResponse.json({ error: tagErr.message }, { status: 500 });
      tagIds.push(...(tagsRows?.map((t: any) => t.id) ?? []));
    }
    await supabase.from("course_tags").delete().eq("course_id", courseId);
    if (tagIds.length) {
      await supabase.from("course_tags").insert(tagIds.map((id) => ({ course_id: courseId, tag_id: id })));
    }
  }

  // Sessions
  if (Array.isArray(body.sessions)) {
    await supabase.from("sessions").delete().eq("course_id", courseId);
    const sessions = body.sessions
      .filter((s: any) => s.start_date)
      .map((s: any) => ({
        id: s.id || randomUUID(),
        course_id: courseId,
        partner_id: s.partner_id ?? null,
        start_date: s.start_date,
        start_time: s.start_time ?? null,
        end_time: s.end_time ?? null,
        city: s.city ?? null,
        address: s.address ?? null,
        price_cents: s.price_cents ?? null,
        deposit_cents: s.deposit_cents ?? null,
        max_participants: s.max_participants ?? null,
        seats_taken: s.seats_taken ?? 0,
      }));
    if (sessions.length) await supabase.from("sessions").insert(sessions);
  }

  // Add-ons
  if (Array.isArray(body.addons)) {
    await supabase.from("addons").delete().eq("course_id", courseId);
    const addons = body.addons
      .filter((a: any) => a.name)
      .map((a: any) => ({
        id: a.id || randomUUID(),
        course_id: courseId,
        name: a.name,
        description: a.description ?? null,
        price_cents: a.price_cents ?? 0,
      }));
    if (addons.length) await supabase.from("addons").insert(addons);
  }

  return NextResponse.json({ data: courseData });
}
