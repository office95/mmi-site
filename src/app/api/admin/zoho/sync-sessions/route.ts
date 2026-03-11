import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { zohoRequest, ZOHO_ORG_ID } from "@/lib/zohoBooks";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev) {
    if (!serviceKey) return NextResponse.json({ error: "Service role key missing" }, { status: 500 });
    const auth = req.headers.get("x-service-role-key");
    if (auth !== serviceKey) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  const orgId = ZOHO_ORG_ID || "";

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id,course_id,start_date,start_time,city,price_cents,deposit_cents,tax_rate,zoho_item_id,courses(title)")
    .order("start_date", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const synced: Array<{ id: string; item_id: string }> = [];
  const skipped: Array<{ id: string; reason: string }> = [];

  for (const s of sessions ?? []) {
    const id = s.id as string;
    if (s.zoho_item_id) {
      skipped.push({ id, reason: "already_synced" });
      continue;
    }
    const title = (s as any).courses?.title || "Kurs";
    const nameParts = [title];
    if (s.start_date) nameParts.push(`(${s.start_date})`);
    const rate = Number(s.deposit_cents ?? s.price_cents ?? 0) / 100;
    const tax = Number(s.tax_rate ?? 0);

    const payload = {
      organization_id: orgId,
      name: nameParts.join(" "),
      rate,
      tax_percentage: tax,
    };

    try {
      const created = (await zohoRequest<{ item?: { item_id?: string } }>("/items", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-com-zoho-books-organizationid": orgId },
        body: JSON.stringify(payload),
      })) as { item?: { item_id?: string } };
      const itemId = created?.item?.item_id;
      if (!itemId) throw new Error("no item_id returned");
      await supabase.from("sessions").update({ zoho_item_id: itemId }).eq("id", id);
      synced.push({ id, item_id: itemId });
    } catch (e: unknown) {
      skipped.push({ id, reason: e instanceof Error ? e.message : "unknown" });
    }
  }

  return NextResponse.json({ ok: true, synced, skipped });
}
