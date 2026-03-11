import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { syncOrderToZoho } from "@/lib/zohoSyncOrder";

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

  // Orders, die paid sind und noch nicht sauber synchronisiert
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, zoho_sync_status, zoho_invoice_id")
    .eq("status", "paid")
    .or("zoho_sync_status.in.(failed,pending),zoho_sync_status.is.null,zoho_invoice_id.is.null");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const synced: Array<{ order_id: string }> = [];
  const failed: Array<{ order_id: string; reason: string }> = [];

  for (const o of orders ?? []) {
    try {
      await syncOrderToZoho(o.id);
      await supabase.from("orders").update({ zoho_sync_status: "synced", zoho_sync_error: null }).eq("id", o.id);
      synced.push({ order_id: o.id });
    } catch (e: any) {
      const reason = e?.message || "unknown";
      await supabase.from("orders").update({ zoho_sync_status: "failed", zoho_sync_error: reason }).eq("id", o.id);
      failed.push({ order_id: o.id, reason: e?.message || "unknown" });
    }
  }

return NextResponse.json({ ok: true, synced, failed, count: orders?.length ?? 0 });
}
