import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");

  let data: any = null;
  if (id) {
    const { data: byId, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (byId) data = byId;
  }
  if (!data && slug) {
    const { data: bySlug, error } = await supabase.from("posts").select("*").eq("slug", slug).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (bySlug) data = bySlug;
  }

  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}
