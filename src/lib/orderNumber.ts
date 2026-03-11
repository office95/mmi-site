import { getSupabaseServiceClient } from "@/lib/supabase";

// Generiert Ordernummern im Format: MMI-<laufendeZahl ab 1100>-<Jahr>
export async function generateOrderNumber(supabase = getSupabaseServiceClient()) {
  const year = new Date().getFullYear();
  const prefix = `MMI-`;
  const suffix = `-${year}`;

  const { data } = await supabase
    .from("orders")
    .select("order_number")
    .ilike("order_number", `${prefix}%${suffix}`)
    .order("order_number", { ascending: false })
    .limit(1);

  const last = data?.[0]?.order_number as string | undefined;
  let lastSeq = 1099; // Start -> next = 1100
  if (last && last.startsWith(prefix) && last.endsWith(String(year))) {
    const mid = last.replace(prefix, "").replace(suffix, "");
    const num = parseInt(mid, 10);
    if (!Number.isNaN(num)) lastSeq = num;
  }
  const next = lastSeq + 1;
  return `${prefix}${next}-${year}`;
}
