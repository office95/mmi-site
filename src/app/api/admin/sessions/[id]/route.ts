import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

const TABLE = "sessions";
export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: Promise<{ id?: string }> }) {
  const { id } = await params;
  const sessionId = id ?? new URL(req.url).pathname.split("/").pop();
  if (!sessionId || sessionId === "undefined") return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
