import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

const TABLE = "homepage_faqs";

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from(TABLE).select("*").order("sort", { ascending: true }).order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const supabase = getSupabaseServiceClient();
  const body = await req.json().catch(() => ({}));
  const { question, answer, region, sort } = body || {};
  if (!question || !answer) return NextResponse.json({ error: "question und answer sind erforderlich" }, { status: 400 });
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      question,
      answer,
      region: region || null,
      sort: typeof sort === "number" ? sort : null,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const supabase = getSupabaseServiceClient();
  const body = await req.json().catch(() => ({}));
  const { id, question, answer, region, sort } = body || {};
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  const update: Record<string, any> = {};
  if (question !== undefined) update.question = question;
  if (answer !== undefined) update.answer = answer;
  if (region !== undefined) update.region = region || null;
  if (sort !== undefined) update.sort = sort;

  const { data, error } = await supabase.from(TABLE).update(update).eq("id", id).select("*").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const supabase = getSupabaseServiceClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
