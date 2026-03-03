import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getRegionFromRequest } from "@/lib/region-request";

export const dynamic = "force-dynamic";
const TABLE = "course_formats";

export async function GET(req: NextRequest) {
  const region = getRegionFromRequest(req);
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .or(`region.eq.${region},region.eq.${region.toLowerCase()},region.is.null,region.eq.`)
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = getSupabaseServiceClient();
  const payload = {
    id: body.id ?? randomUUID(),
    name: body.name,
    slug: body.slug || body.name?.toLowerCase().replace(/\s+/g, "-"),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from(TABLE).upsert(payload, { onConflict: "id" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
