import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { SEO_PAGE_REGISTRY } from "@/lib/seo-registry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TABLE = "seo_matrix";
const ALLOWED_VARIANTS = ["at", "de"] as const;
const ALLOWED_LOCALES = ["de-AT", "de-DE"] as const;

type DomainVariant = (typeof ALLOWED_VARIANTS)[number];

const normalizeSlug = (raw: string | null | undefined): string => {
  if (!raw) return "/";
  let s = raw.trim();
  if (!s) return "/";
  try {
    const asUrl = new URL(s.startsWith("http") ? s : `https://placeholder${s.startsWith("/") ? "" : "/"}${s}`);
    s = asUrl.pathname || "/";
  } catch {
    /* ignore */
  }
  if (!s.startsWith("/")) s = `/${s}`;
  s = s.replace(/\s+/g, "").replace(/\/+$/g, "");
  return s || "/";
};

const cleanUrl = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed;
};

function validate(body: any): { payload?: any; error?: string } {
  const page_key = (body.page_key || "").trim();
  const domain_variant = (body.domain_variant || "").toLowerCase();
  const locale = (body.locale || "").trim();
  const title_tag = (body.title_tag || "").trim();
  const h1 = (body.h1 || "").trim();
  const slug = normalizeSlug(body.slug);
  const meta_description = body.meta_description?.toString() ?? null;
  const hero_subline = body.hero_subline?.toString() ?? null;
  const canonical_url = cleanUrl(body.canonical_url);
  const hreflang_target_url = cleanUrl(body.hreflang_target_url);
  const robots_index = body.robots_index ?? true;
  const robots_follow = body.robots_follow ?? true;
  const country_label = body.country_label?.toString() ?? null;
  const internal_notes = body.internal_notes?.toString() ?? null;

  if (!page_key) return { error: "page_key ist Pflicht" };
  if (!title_tag) return { error: "title_tag ist Pflicht" };
  if (!h1) return { error: "h1 ist Pflicht" };
  if (!ALLOWED_VARIANTS.includes(domain_variant as DomainVariant)) return { error: "domain_variant muss 'at' oder 'de' sein" };
  if (!ALLOWED_LOCALES.includes(locale as (typeof ALLOWED_LOCALES)[number])) return { error: "locale muss de-AT oder de-DE sein" };

  const payload = {
    id: body.id ?? randomUUID(),
    page_key,
    slug,
    domain_variant,
    locale,
    title_tag,
    meta_description,
    h1,
    hero_subline,
    canonical_url,
    hreflang_target_url,
    robots_index: Boolean(robots_index),
    robots_follow: Boolean(robots_follow),
    country_label,
    internal_notes,
    updated_at: new Date().toISOString(),
  };
  return { payload };
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServiceClient();

  // Auto-Seeding: fehlende Registry-Einträge für AT/DE anlegen, damit neue Seiten/Template-Keys automatisch erscheinen
  for (const page of SEO_PAGE_REGISTRY) {
    for (const variant of ALLOWED_VARIANTS) {
      const locale = variant === "de" ? "de-DE" : "de-AT";
      const slug = normalizeSlug(page.slug);
      const exists = await supabase
        .from(TABLE)
        .select("id")
        .eq("page_key", page.pageKey)
        .eq("domain_variant", variant)
        .maybeSingle();
      if (!exists.data) {
        const seed = {
          page_key: page.pageKey,
          slug,
          domain_variant: variant,
          locale,
          title_tag: page.defaultTitle,
          h1: page.defaultH1,
          meta_description: page.defaultDescription ?? null,
          robots_index: true,
          robots_follow: true,
        };
        await supabase.from(TABLE).insert([seed as any]);
      }
    }
  }

  const pageKey = req.nextUrl.searchParams.get("page_key");
  const query = supabase
    .from(TABLE)
    .select("*")
    .order("page_key", { ascending: true })
    .order("domain_variant", { ascending: true })
    .neq("page_key", "standorte"); // standorte deaktiviert
  const { data, error } = pageKey ? await query.eq("page_key", pageKey) : await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const groups = new Map<string, any[]>();
  (data ?? []).forEach((row) => {
    const list = groups.get(row.page_key) || [];
    list.push(row);
    groups.set(row.page_key, list);
  });

  const warnings: Record<string, string[]> = {};
  (data ?? []).forEach((row) => {
    const rowWarnings: string[] = [];
    const siblings = groups.get(row.page_key) || [];
    const counterpart = siblings.find((r) => r.domain_variant !== row.domain_variant);
    if (!counterpart) rowWarnings.push("missing_counterpart");
    if (!row.canonical_url) rowWarnings.push("missing_canonical");
    if (!row.hreflang_target_url && !counterpart?.slug && !counterpart?.canonical_url) rowWarnings.push("missing_hreflang");
    warnings[row.id] = rowWarnings;
  });

  return NextResponse.json({ data: data ?? [], warnings });
}

export async function POST(req: Request) {
  const supabase = getSupabaseServiceClient();
  const body = await req.json();
  const { payload, error } = validate(body);
  if (!payload) return NextResponse.json({ error }, { status: 400 });

  const { data, error: sbError } = await supabase.from(TABLE).upsert(payload, { onConflict: "page_key,domain_variant" }).select().single();
  if (sbError) return NextResponse.json({ error: sbError.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const supabase = getSupabaseServiceClient();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });
  const { payload, error } = validate(body);
  if (!payload) return NextResponse.json({ error }, { status: 400 });

  const { data, error: sbError } = await supabase.from(TABLE).update(payload).eq("id", body.id).select().single();
  if (sbError) return NextResponse.json({ error: sbError.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
