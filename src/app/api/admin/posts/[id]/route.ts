import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id: paramId } = await params;
  const url = new URL(req.url);
  const fallback = url.pathname.split("/").filter(Boolean).pop();
  const id = paramId ?? fallback;
  if (!id || id === "undefined") {
    return NextResponse.json({ error: "id missing" }, { status: 400 });
  }
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}
