import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { zohoRequest, ZOHO_ORG_ID } from "@/lib/zohoBooks";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Service role key missing" }, { status: 500 });
  const authHeader = req.headers.get("x-service-role-key");
  if (authHeader !== serviceKey) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseServiceClient();

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id,title,base_price_cents,tax_rate,zoho_item_id")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const synced: Array<{ id: string; title: string; item_id: string }> = [];
  const skipped: Array<{ id: string; reason: string }> = [];
  for (const c of courses ?? []) {
    const id = c.id as string;
    const title = (c as { title?: string }).title || "Kurs";
    const price = Number((c as { base_price_cents?: number }).base_price_cents ?? 0) / 100;
    const tax = Number((c as { tax_rate?: number | null }).tax_rate ?? 0);
    const existing = (c as { zoho_item_id?: string | null }).zoho_item_id ?? null;
    if (existing) {
      skipped.push({ id, reason: "already_synced" });
      continue;
    }
    try {
      const created = (await zohoRequest<{ item?: { item_id?: string } }>("/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: ZOHO_ORG_ID, name: title || "Kurs", rate: price, tax_percentage: tax }),
      })) as { item?: { item_id?: string } };
      const itemId = created?.item?.item_id;
      if (!itemId) throw new Error("no item_id returned");
      await supabase.from("courses").update({ zoho_item_id: itemId }).eq("id", id);
      synced.push({ id, title, item_id: itemId });
    } catch (e: unknown) {
      skipped.push({ id, reason: e instanceof Error ? e.message : "unknown" });
    }
  }

  return NextResponse.json({ ok: true, synced, skipped });
}
