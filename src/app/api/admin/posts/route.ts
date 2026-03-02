import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { randomUUID } from "crypto";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // partner names
  const partnerIds = Array.from(new Set((posts ?? []).map((p) => p.author_partner_id).filter(Boolean))) as string[];
  let partnerMap: Record<string, { name?: string }> = {};
  if (partnerIds.length) {
    const { data: partners } = await supabase.from("partners").select("id,name").in("id", partnerIds);
    partnerMap = Object.fromEntries((partners ?? []).map((p) => [p.id, { name: p.name }]));
  }

  const enriched = (posts ?? []).map((p) => ({
    ...p,
    partner_name: p.author_partner_id ? partnerMap[p.author_partner_id]?.name ?? null : null,
  }));

  return NextResponse.json({ data: enriched });
}

export async function POST(req: Request) {
  const supabase = getSupabaseServiceClient();
  const body = await req.json();

  const id = body.id ?? randomUUID();
  let slug: string = body.slug;
  if (!slug && body.title) {
    slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  if (!slug) return NextResponse.json({ error: "Slug oder Titel fehlt" }, { status: 400 });

  // ensure unique slug
  slug = await ensureUniqueSlug(supabase, slug, id);

  const payload = {
    id,
    title: body.title,
    slug,
    status: body.status ?? "draft",
    author_type: body.author_type ?? "admin",
    author_partner_id: body.author_partner_id ?? null,
    cover_image_url: body.cover_image_url ?? null,
    excerpt: body.excerpt ?? null,
    content: body.content ?? null,
    tags: Array.isArray(body.tags) ? body.tags : [],
    category_id: body.category_id ?? null,
    type_id: body.type_id ?? null,
    published_at:
      body.status === "published"
        ? body.published_at ?? new Date().toISOString()
        : body.published_at ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("posts").upsert(payload, { onConflict: "id" }).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

async function ensureUniqueSlug(supabase: any, base: string, currentId: string): Promise<string> {
  let slug = base;
  for (let i = 0; i < 50; i++) {
    const { data: existing, error } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();
    if (error) break;
    if (!existing || existing.id === currentId) return slug;
    slug = `${base}-${i + 1}`;
  }
  return slug;
}
