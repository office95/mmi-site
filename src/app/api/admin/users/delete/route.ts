import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id } = body as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseServiceClient();

  // 1) Profile löschen
  const { error: profileError } = await supabase.from("profiles").delete().eq("user_id", id);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  // 2) Auth-User löschen
  const { error: authError } = await supabase.auth.admin.deleteUser(id);
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
