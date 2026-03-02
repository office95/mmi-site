import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

type CrmPartner = {
  id: string;
  slug?: string | null;
  name: string;
  city?: string | null;
  country?: string | null;
  state?: string | null;
  zip?: string | null;
  short_description?: string | null;
  website_description?: string | null;
  website_slogan?: string | null;
  hero_image_url?: string | null;
  logo_path?: string | null;
  hero1_path?: string | null;
  hero2_path?: string | null;
  gallery_paths?: string[] | null;
  teacher_profiles?: unknown | null;
  teacher_image?: string | null;
  teacher_name?: string | null;
  teacher_description?: string | null;
  website_tags?: string[] | null;
  tags?: string[] | null;
  email?: string | null;
  status?: string | null;
  updated_at?: string | null;
  is_active?: boolean | null;
};

const CRM_ENDPOINT = process.env.CRM_PARTNER_ENDPOINT;
const CRM_TOKEN = process.env.CRM_PARTNER_TOKEN;
const FETCH_TIMEOUT_MS = 15000;

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!CRM_ENDPOINT || !CRM_TOKEN) {
    return NextResponse.json(
      { error: "CRM_PARTNER_ENDPOINT or CRM_PARTNER_TOKEN missing" },
      { status: 500 },
    );
  }

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(CRM_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${CRM_TOKEN}`,
        apikey: CRM_TOKEN,
        Accept: "application/json",
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(t));

    if (!res.ok) {
      return NextResponse.json(
        { error: "CRM request failed", status: res.status },
        { status: 502 },
      );
    }

    const data = (await res.json()) as CrmPartner[];

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Unexpected CRM payload" }, { status: 500 });
    }

    const rows = data.map((p) => ({
      id: p.id,
      slug: p.slug ?? p.id,
      name: p.name,
      city: p.city ?? null,
      state: p.state ?? null,
      zip: p.zip ?? null,
      country: p.country ?? "DE",
      short_description: p.short_description ?? null,
      website_description: p.website_description ?? null,
      website_slogan: p.website_slogan ?? null,
      hero_image_url: p.hero_image_url ?? null,
      logo_path: p.logo_path ?? null,
      hero1_path: p.hero1_path ?? null,
      hero2_path: p.hero2_path ?? null,
      gallery_paths: p.gallery_paths ?? [],
      teacher_profiles: p.teacher_profiles ?? null,
      teacher_image: p.teacher_image ?? null,
      teacher_name: p.teacher_name ?? null,
      teacher_description: p.teacher_description ?? null,
      website_tags: p.website_tags ?? [],
      tags: p.tags ?? [],
      email: p.email ?? null,
      status: p.status ?? null,
      is_active: p.is_active ?? true,
      updated_at: p.updated_at ?? new Date().toISOString(),
    }));

    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from("partners_public").upsert(rows, {
      onConflict: "id",
    });

    if (error) {
      console.error("Supabase upsert error", error);
      return NextResponse.json(
        { error: "Upsert failed", details: error.message, code: error.code, hint: error.hint },
        { status: 500 },
      );
    }

    const debug = new URL(req.url).searchParams.get("debug");
    return NextResponse.json(
      debug
        ? { ok: true, upserted: rows.length, sample: rows[0] ?? null }
        : { ok: true, upserted: rows.length },
    );
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string };
    const message = e?.name === "AbortError" ? "CRM request timeout" : e?.message ?? "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
