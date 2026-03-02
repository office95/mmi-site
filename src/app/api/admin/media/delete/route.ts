import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  const supabase = getSupabaseServiceClient();
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  if (!name) return NextResponse.json({ error: "name missing" }, { status: 400 });

  const { error } = await supabase.storage.from("media").remove([name]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("media_files").delete().eq("path", name);

  return NextResponse.json({ ok: true });
}
