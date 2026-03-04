import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

const TABLE = "diploma_applications";

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from(TABLE).select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const supabase = getSupabaseServiceClient();
  const body = await req.json().catch(() => ({}));
  const { id, status, notes } = body || {};
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });
  const update: Record<string, any> = {};
  if (status) update.status = status;
  if (notes !== undefined) update.notes = notes;
  const { data, error } = await supabase.from(TABLE).update(update).eq("id", id).select("*").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
