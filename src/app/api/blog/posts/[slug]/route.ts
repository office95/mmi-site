import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_: Request, { params }: Params) {
  const { slug } = await params;
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data });
}
