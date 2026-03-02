import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { randomUUID } from "crypto";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = getSupabaseServiceClient();
  const body = await req.json();
  const token = body.token as string;
  if (!token) return NextResponse.json({ error: "Token fehlt" }, { status: 400 });

  const { data: ml, error: errToken } = await supabase
    .from("magic_links")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (errToken) return NextResponse.json({ error: errToken.message }, { status: 500 });
  if (!ml) return NextResponse.json({ error: "Token ungültig" }, { status: 400 });
  const now = new Date();
  if (ml.expires_at && new Date(ml.expires_at) < now) return NextResponse.json({ error: "Token abgelaufen" }, { status: 400 });
  if (ml.max_uses !== null && ml.use_count >= ml.max_uses) return NextResponse.json({ error: "Token bereits genutzt" }, { status: 400 });

  const id = randomUUID();
  let slug: string = body.slug;
  if (!slug && body.title) {
    slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  if (!slug) return NextResponse.json({ error: "Titel oder Slug fehlt" }, { status: 400 });

  slug = await ensureUniqueSlug(supabase, slug);

  const contentMeta = {
    meta: {
      name: body.author_name || null,
      bio: body.author_bio || null,
      avatar: body.author_avatar_url || null,
      category: body.category || null,
    },
    blocks: parseBlocks(body.content),
  };

  const postPayload = {
    id,
    title: body.title,
    slug,
    status: "pending",
    author_type: "partner",
    author_partner_id: ml.partner_id ?? null,
    cover_image_url: body.cover_image_url ?? null,
    excerpt: null,
    content: JSON.stringify(contentMeta),
    tags: Array.isArray(body.tags) ? body.tags : [],
    category: body.category ?? null,
    author_name: body.author_name ?? null,
    author_bio: body.author_bio ?? null,
    author_avatar_url: body.author_avatar_url ?? null,
    updated_at: now.toISOString(),
  };

  const { data: post, error: errPost } = await supabase.from("posts").insert(postPayload).select().single();
  if (errPost) return NextResponse.json({ error: errPost.message }, { status: 500 });

  await supabase
    .from("magic_links")
    .update({
      use_count: (ml.use_count ?? 0) + 1,
      used_at: now.toISOString(),
    })
    .eq("id", ml.id);

  return NextResponse.json({ data: post });
}

async function ensureUniqueSlug(supabase: any, base: string): Promise<string> {
  let slug = base;
  for (let i = 0; i < 50; i++) {
    const { data: existing, error } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();
    if (error) break;
    if (!existing) return slug;
    slug = `${base}-${i + 1}`;
  }
  return slug;
}

function parseBlocks(raw: any) {
  if (!raw) return [];
  try {
    const json = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.blocks)) return json.blocks;
  } catch (e) {
    console.error("parseBlocks", e);
  }
  return [];
}
