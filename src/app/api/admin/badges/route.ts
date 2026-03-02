import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type BadgePayload = {
  id?: string;
  name?: string;
  slug?: string;
  scope?: "course" | "partner" | "both";
  color?: string;
  icon?: string | null;
  auto_type?: string | null;
};

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("badges").select("*").order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const body: BadgePayload = await req.json();
  const supabase = getSupabaseServiceClient();
  const payload = {
    name: body.name,
    slug: body.slug,
    scope: body.scope,
    color: body.color ?? "#ff1f8f",
    icon: body.icon ?? null,
    auto_type: body.auto_type ?? null,
  };
  const { data, error } = await supabase.from("badges").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PUT(req: Request) {
  const body: BadgePayload = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("badges")
    .update({
      name: body.name,
      slug: body.slug,
      scope: body.scope,
      color: body.color,
      icon: body.icon ?? null,
      auto_type: body.auto_type ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("badges").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
