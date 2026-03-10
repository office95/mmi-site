import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = getSupabaseServiceClient();
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const onlyAuto = searchParams.get("auto") === "1" || searchParams.get("auto") === "true";

  const query = supabase.from("badges").select("id,name,slug,scope,color,icon,auto_type").order("name", { ascending: true });
  if (scope === "course" || scope === "partner" || scope === "both") query.eq("scope", scope);
  if (onlyAuto) query.not("auto_type", "is", null);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
