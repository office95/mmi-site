import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const supabase = getSupabaseServiceClient();
  const body = await req.json().catch(() => null);
  const order = body?.order as { id: string; position: number }[] | undefined;
  if (!order || !Array.isArray(order)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  for (const item of order) {
    const { error } = await supabase.from("hero_slides").update({ position: item.position }).eq("id", item.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, count: order.length });
}
