import { NextResponse, NextRequest } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { randomUUID } from "crypto";
import { getRegionFromRequest } from "@/lib/region-request";
import { getUserEmailFromRequest } from "@/lib/request-user";

export const dynamic = "force-dynamic";

const TABLE = "partners";

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9äöüß -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export async function GET(req: NextRequest) {
  const region = getRegionFromRequest(req);
  const includeAll = req.nextUrl.searchParams.get("all") === "1";
  const supabase = getSupabaseServiceClient();
  const base = supabase.from(TABLE).select("*");
  const query = includeAll
    ? base
    : base.or(`region.eq.${region},region.eq.${region.toLowerCase()},region.ilike.%${region}%,region.is.null,region.eq.,region.eq.%20`);
  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = getSupabaseServiceClient();
  const actor = getUserEmailFromRequest(req) ?? "system";
  const partnerId = body.id ?? randomUUID();
  const { data: existing } = await supabase
    .from(TABLE)
    .select("created_at, created_by")
    .eq("id", partnerId)
    .maybeSingle();

  const payload = {
    id: partnerId,
    slug: slugify(body.name ?? ""),
    status: body.status ?? "active",
    name: body.name,
    street: body.street ?? null,
    zip: body.zip ?? null,
    city: body.city ?? null,
    country: body.country ?? "Österreich",
    state: body.state ?? null,
    website: body.website ?? null,
    phone: body.phone ?? null,
    email: body.email ?? null,
    tags: body.tags ?? [],
    genres: body.genres ?? body.genre ?? [],
    genre: body.genre ?? (Array.isArray(body.genres) ? body.genres.join(", ") : null),
    references_list: body.references_list ?? body.references ?? [],
    logo_path: body.logo_path ?? null,
    hero1_path: body.hero1_path ?? null,
    hero1_mobile_path: body.hero1_mobile_path ?? null,
    promo_path: body.promo_path ?? null,
    promo_mobile_path: body.promo_mobile_path ?? null,
    gallery_paths: body.gallery_paths ?? [],
    slogan: body.slogan ?? null,
    description: body.description ?? null,
    instructor_profiles: body.instructor_profiles ?? [],
    created_at: existing?.created_at ?? body.created_at ?? undefined,
    created_by: existing?.created_by ?? actor,
    updated_by: actor,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from(TABLE).upsert(payload, { onConflict: "id" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
