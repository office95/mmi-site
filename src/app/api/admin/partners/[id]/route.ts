import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

const TABLE = "partners";
export const dynamic = "force-dynamic";

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9äöüß -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServiceClient();
  const body = await req.json();
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      ...body,
      slug: body.name ? slugify(body.name) : body.slug,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServiceClient();
  // posts.author_partner_id auf NULL setzen, um FK-Verletzung zu vermeiden
  const { error: postErr } = await supabase.from("posts").update({ author_partner_id: null }).eq("author_partner_id", id);
  if (postErr) return NextResponse.json({ error: postErr.message }, { status: 500 });

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
