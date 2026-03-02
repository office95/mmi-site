import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

const FALLBACK_FORM_ID = "a6b28590-9885-42e8-a460-9ffd27b59ae3";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params;
  const supabase = getSupabaseServiceClient();
  const id = paramId && paramId !== "undefined" ? paramId : FALLBACK_FORM_ID;

  const { data, error } = await supabase
    .from("forms")
    .select("*, form_fields(*)")
    .eq("id", id)
    .eq("is_live", true)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Form not found or not live" }, { status: 404 });

  const sorted = {
    ...data,
    form_fields: (data.form_fields ?? []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  };

  return NextResponse.json({ data: sorted });
}
