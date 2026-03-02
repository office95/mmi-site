import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = getSupabaseServiceClient();

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const title = (form.get("title") as string) || null;
  const subtitle = (form.get("subtitle") as string) || null;
  const position = Number(form.get("position")) || 0;

  if (!file) {
    return NextResponse.json({ error: "file missing" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = file.name.split(".").pop() || "jpg";
  const objectPath = `hero/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("hero").upload(objectPath, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const publicUrl = supabase.storage.from("hero").getPublicUrl(objectPath).data.publicUrl;

  const { error: insertError, data } = await supabase
    .from("hero_slides")
    .insert({ title, subtitle, image_url: publicUrl, position, is_active: true })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slide: data });
}
