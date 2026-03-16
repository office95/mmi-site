import { getSupabaseServiceClient } from "@/lib/supabase";

type OrderNumberOptions = {
  supabase?: ReturnType<typeof getSupabaseServiceClient>;
  regionSuffix?: string; // z.B. "AT" | "DE" (fällt sonst auf "XX")
};

// Neues Format: MMI-<LAND>-<Jahr>-<fünfstellige Sequenz>
// Beispiel: MMI-AT-2026-00001
export async function generateOrderNumber(opts: OrderNumberOptions = {}) {
  const supabase = opts.supabase ?? getSupabaseServiceClient();
  const year = new Date().getFullYear();
  const region = (opts.regionSuffix || "XX").toUpperCase();
  const prefix = `MMI-${region}-${year}-`;

  const { data } = await supabase
    .from("orders")
    .select("order_number")
    .ilike("order_number", `${prefix}%`)
    .order("order_number", { ascending: false })
    .limit(1);

  const last = data?.[0]?.order_number as string | undefined;
  // Default-Startwerte, falls es noch keine Nummern gibt.
  // Ab 2026 sollen AT-Buchungen bei 10101 starten.
  let lastSeq = region === "AT" && year === 2026 ? 10100 : 0;
  if (last && last.startsWith(prefix)) {
    const seq = last.slice(prefix.length);
    const num = parseInt(seq, 10);
    if (!Number.isNaN(num)) lastSeq = Math.max(lastSeq, num);
  }

  const next = lastSeq + 1;
  const seqPart = String(next).padStart(5, "0");
  return `${prefix}${seqPart}`;
}
