import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
const TABLE = "course_levels";

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from(TABLE).select("*").order("name", { ascending: true });
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
    sort_order: body.sort_order ?? 0,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from(TABLE).upsert(payload, { onConflict: "id" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
