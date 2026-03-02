import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("media_files")
    .select("path,url,title,alt,size_bytes,created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const files =
    data?.map((f) => ({
      name: f.path,
      url: f.url,
      title: f.title,
      alt: f.alt,
      size: f.size_bytes,
      created_at: f.created_at,
    })) ?? [];

  return NextResponse.json({ files });
}
