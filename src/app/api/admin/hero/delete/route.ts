import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  const supabase = getSupabaseServiceClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const { data, error } = await supabase.from("hero_slides").select("image_url").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data?.image_url) {
    const parts = data.image_url.split("/storage/v1/object/public/hero/");
    if (parts[1]) {
      await supabase.storage.from("hero").remove([parts[1]]);
    }
  }

  const { error: del } = await supabase.from("hero_slides").delete().eq("id", id);
  if (del) return NextResponse.json({ error: del.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
