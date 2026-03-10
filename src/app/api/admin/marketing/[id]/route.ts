import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ALLOWED: string[] = ["scheduled", "paused", "published", "needs_approval", "generated", "eligible"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = getSupabaseServiceClient();
  const body = await req.json();
  const status = body?.status as string | undefined;
  if (!status || !ALLOWED.includes(status)) return NextResponse.json({ error: "invalid status" }, { status: 400 });

  try {
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .update({
        status,
        updated_at: new Date().toISOString(),
        approved_at: status === "scheduled" || status === "published" ? new Date().toISOString() : null,
        approved_by: status === "scheduled" || status === "published" ? "admin" : null, // Platzhalter, später User-ID
      })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unknown error" }, { status: 500 });
  }
}
