import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
const TABLE = "course_categories";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params;
  const url = new URL(req.url);
  const id = paramId ?? url.searchParams.get("id") ?? req.headers.get("x-id");
  if (!id || id === "undefined") return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}
