import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { zohoRequest, ZOHO_ORG_ID } from "@/lib/zohoBooks";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "Service role key missing" }, { status: 500 });
  const auth = req.headers.get("x-service-role-key");
  if (auth !== serviceKey) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseServiceClient();

  // Orders, die paid sind und noch keine Zoho-Verknüpfung haben
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id,course_id,session_id,email,amount_cents,currency,customer_first,customer_last,customer_name,coupon_code,promotion_code,notes,stripe_payment_intent")
    .eq("status", "paid")
    .is("zoho_invoice_id", null)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const synced: Array<{ order_id: string; invoice_id: string }> = [];
  const failed: Array<{ order_id: string; reason: string }> = [];

  // Lade Kurs-Infos (zoho_item_id, tax_rate)
  const courseIds = Array.from(new Set((orders ?? []).map((o) => o.course_id).filter(Boolean))) as string[];
  const courseMap = new Map<string, { zoho_item_id?: string | null; tax_rate?: number | null; title?: string }>();
  if (courseIds.length) {
    const { data: courses } = await supabase
      .from("courses")
      .select("id,title,zoho_item_id,tax_rate")
      .in("id", courseIds);
    courses?.forEach((c) => courseMap.set(c.id, c));
  }

  for (const o of orders ?? []) {
    const orderId = o.id;
    const email = o.email || "";
    const amount = Number(o.amount_cents ?? 0) / 100;
    const courseInfo = o.course_id ? courseMap.get(o.course_id) : undefined;
    const taxPercentage = Number(courseInfo?.tax_rate ?? 0);

    try {
      // Kontakt anlegen/finden
      const contactPayload = {
        organization_id: ZOHO_ORG_ID,
        contact_name: o.customer_name || `${o.customer_first ?? ""} ${o.customer_last ?? ""}`.trim() || email || "Unbekannt",
        customer_sub_type: "individual",
        contact_type: "customer",
        email,
      };
      const contactResp = (await zohoRequest<{ contact?: { contact_id?: string }; contact_id?: string }>("/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-com-zoho-books-organizationid": ZOHO_ORG_ID },
        body: JSON.stringify(contactPayload),
      }).catch(async () => {
        const list = await zohoRequest<{ contacts?: Array<{ contact_id?: string }> }>(
          `/contacts?organization_id=${ZOHO_ORG_ID}&email=${encodeURIComponent(email)}`
        );
        const existing = list?.contacts?.[0];
        if (existing?.contact_id) return { contact: existing } as { contact: { contact_id: string } };
        throw new Error("contact create failed");
      })) as { contact?: { contact_id?: string }; contact_id?: string };

      const contactId = contactResp?.contact?.contact_id ?? contactResp?.contact_id ?? null;

      const invoicePayload = {
        customer_id: contactId,
        organization_id: ZOHO_ORG_ID,
        line_items: [
          {
            item_id: courseInfo?.zoho_item_id,
            item_name: `Anzahlung – ${courseInfo?.title || "Kursbuchung"}`,
            rate: amount,
            quantity: 1,
            tax_percentage: taxPercentage,
          },
        ],
        custom_fields: [],
        reference_number: o.stripe_payment_intent || undefined,
        notes: o.notes || undefined,
      };

      const inv = (await zohoRequest<{ invoice?: { invoice_id?: string } }>("/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-com-zoho-books-organizationid": ZOHO_ORG_ID },
        body: JSON.stringify(invoicePayload),
      })) as { invoice?: { invoice_id?: string } };
      const invoiceId = inv?.invoice?.invoice_id;
      if (!invoiceId) throw new Error("invoice create failed");

      await supabase.from("orders").update({ zoho_invoice_id: invoiceId }).eq("id", orderId);
      synced.push({ order_id: orderId, invoice_id: invoiceId });
    } catch (e: unknown) {
      failed.push({ order_id: orderId, reason: e instanceof Error ? e.message : "unknown" });
    }
  }

  return NextResponse.json({ ok: true, synced, failed, count: orders?.length ?? 0 });
}
