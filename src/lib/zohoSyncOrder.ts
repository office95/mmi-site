import { getSupabaseServiceClient } from "@/lib/supabase";
import { zohoRequest, ZOHO_ORG_ID } from "@/lib/zohoBooks";

type SupabaseClient = ReturnType<typeof getSupabaseServiceClient>;

type OrderWithJoins = {
  id: string;
  order_number: string;
  status: string;
  amount_cents: number | null;
  deposit_cents: number | null;
  currency: string | null;
  course_id: string | null;
  session_id: string | null;
  first_name: string | null;
  last_name: string | null;
  customer_name: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  zip: string | null;
  city: string | null;
  country: string | null;
  dob: string | null;
  company_name: string | null;
  company_uid: string | null;
  stripe_payment_intent: string | null;
  checkout_session_id: string | null;
  zoho_contact_id: string | null;
  zoho_invoice_id: string | null;
  zoho_payment_id: string | null;
  zoho_sync_status: string | null;
  zoho_sync_error: string | null;
  zoho_synced_at: string | null;
  created_at: string;
  sessions: {
    id: string;
    title: string | null;
    start_date: string | null;
    start_time: string | null;
    partner_id?: string | null;
    city: string | null;
    address: string | null;
    zip: string | null;
    country: string | null;
    tax_rate: number | null;
    price_cents: number | null;
    deposit_cents: number | null;
    zoho_item_id: string | null;
    partner_name?: string | null;
    partners?: { name: string | null; city: string | null; address: string | null } | null;
  } | null;
  courses: {
    id: string;
    title: string | null;
    tax_rate: number | null;
    zoho_item_id: string | null;
  } | null;
};

const ORG_ID = ZOHO_ORG_ID || "";

export async function syncOrderToZoho(orderId: string) {
  if (!ORG_ID) throw new Error("ZOHO_ORG_ID missing");
  const supabase = getSupabaseServiceClient();
  const order = await loadOrder(supabase, orderId);
  if (!order) throw new Error("order not found");
  if (order.status !== "paid") throw new Error("order not paid");

  const paidCents = Number(order.amount_cents ?? 0);
  if (!Number.isFinite(paidCents) || paidCents <= 0) throw new Error("paid amount missing");

  // Contact
  const contactId = await ensureZohoContact(order);

  // Session Item
  const { itemId, taxPercentage } = await ensureSessionZohoItem(order);

  // Invoice (idempotent)
  const invoiceId = await ensureZohoInvoice(order, contactId, itemId, paidCents, taxPercentage);

  // Payment (idempotent)
  const paymentId = await ensureZohoPayment(order, invoiceId, paidCents);

  // Persist success
  await supabase
    .from("orders")
    .update({
      zoho_contact_id: contactId,
      zoho_invoice_id: invoiceId,
      zoho_payment_id: paymentId,
      zoho_sync_status: "synced",
      zoho_sync_error: null,
      zoho_synced_at: new Date().toISOString(),
    })
    .eq("id", order.id);
}

async function loadOrder(supabase: SupabaseClient, orderId: string): Promise<OrderWithJoins | null> {
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  if (!order) return null;

  let session: OrderWithJoins["sessions"] | null = null;
  if (order.session_id) {
    const { data: sData } = await supabase
      .from("sessions")
      .select("id,title,start_date,start_time,city,address,zip,country,tax_rate,price_cents,deposit_cents,zoho_item_id,partner_id,partner_name")
      .eq("id", order.session_id)
      .maybeSingle();
    if (sData) {
      let partner: { name: string | null; city: string | null; address: string | null } | null = null;
      if ((sData as any).partner_id) {
        const { data: pData } = await supabase
          .from("partners")
          .select("name,city,state,country,street,zip,address")
          .eq("id", (sData as any).partner_id as string)
          .maybeSingle();
        partner = (pData as any) || null;
      }
      session = { ...(sData as any), partners: partner };
    }
  }

  let course: OrderWithJoins["courses"] | null = null;
  if (order.course_id) {
    const { data: cData } = await supabase.from("courses").select("id,title,tax_rate,zoho_item_id").eq("id", order.course_id).maybeSingle();
    course = (cData as any) || null;
  }

  return {
    ...(order as any),
    sessions: session,
    courses: course,
  } as OrderWithJoins;
}

async function ensureZohoContact(order: OrderWithJoins): Promise<string> {
  const email = order.email || "";
  const fullName = order.customer_name || `${order.first_name || ""} ${order.last_name || ""}`.trim() || email || "Unbekannter Kunde";
  const company = order.company_name || undefined;
  const attention = fullName || undefined;

  if (!email) throw new Error("order email missing for contact");

  // 1) Suche per Email
  const found = await findContactByEmail(email);
  if (found) return found;

  // 2) Anlegen
  let contactName = company || fullName || email || `Kunde ${order.order_number}`;
  const payload = {
    organization_id: ORG_ID,
    contact_name: contactName,
    company_name: company,
    contact_type: "customer",
    customer_sub_type: "individual",
    email,
    phone: order.phone || undefined,
    billing_address: {
      attention,
      address: order.street || undefined,
      city: order.city || undefined,
      zip: order.zip || undefined,
      country: order.country || undefined,
    },
    shipping_address: {
      attention,
      address: order.street || undefined,
      city: order.city || undefined,
      zip: order.zip || undefined,
      country: order.country || undefined,
    },
    notes: order.dob ? `Geburtsdatum: ${order.dob}` : undefined,
  };

  try {
    const created = await createContact(payload);
    return created;
  } catch (e: any) {
    const msg = e?.message || "";
    // Duplicate name -> versuche bestehenden Kontakt zu finden oder neuen Namen verwenden
    if (msg.includes("3062") || msg.toLowerCase().includes("bereits vorhanden")) {
      const byName = await findContactByName(contactName);
      if (byName) return byName;
      contactName = `${contactName} ${order.order_number || ""}`.trim();
      payload.contact_name = contactName;
      const retry = await createContact(payload);
      return retry;
    }
    throw e;
  }
}

async function ensureSessionZohoItem(order: OrderWithJoins): Promise<{ itemId: string; taxPercentage: number }> {
  const session = order.sessions;
  const course = order.courses;
  if (!session && !course) throw new Error("session or course missing");

  const tax = Number(session?.tax_rate ?? course?.tax_rate ?? 0);

  // use cached IDs
  if (session?.zoho_item_id) return { itemId: session.zoho_item_id, taxPercentage: tax };

  // try find by SKU
  const sku = `SESSION-${session?.id ?? order.session_id ?? ""}`;
  const found = await findItemBySku(sku);
  if (found) {
    await updateSessionItemId(order.session_id, found);
    return { itemId: found, taxPercentage: tax };
  }

  const nameParts = [course?.title || session?.title || "Kursbuchung"];
  if (session?.start_date) nameParts.push(`(${session.start_date})`);
  const descParts = [course?.title || session?.title || "Kursbuchung"];
  if (session?.start_date) descParts.push(`Start: ${session.start_date}`);
  if (session?.city) descParts.push(`Ort: ${session.city}`);
  if (session?.partners?.name) descParts.push(`Partner: ${session.partners.name}`);
  descParts.push(`Session-ID: ${session?.id}`);

  const rateCents = Number(session?.deposit_cents ?? session?.price_cents ?? order.deposit_cents ?? order.amount_cents ?? 0);

  const payload = {
    organization_id: ORG_ID,
    name: nameParts.join(" "),
    rate: rateCents / 100,
    tax_percentage: tax,
    sku,
    description: descParts.join(" • "),
  };

  const created = await createItem(payload);
  await updateSessionItemId(order.session_id, created);
  return { itemId: created, taxPercentage: tax };
}

async function ensureZohoInvoice(order: OrderWithJoins, contactId: string, itemId: string, paidCents: number, taxPercentage: number): Promise<string> {
  if (order.zoho_invoice_id) return order.zoho_invoice_id;

  // Suche per reference/order_number
  const existing = await findInvoiceByReference(order.order_number);
  if (existing) {
    await persistInvoice(order.id, existing);
    return existing;
  }

  const session = order.sessions;
  const course = order.courses;
  const sessionTitle = session?.title || course?.title || "Kursbuchung";
  // Falls Startdatum noch fehlt, einmal nachladen
  let startDate = session?.start_date || "";
  let city = session?.city || session?.partners?.city || "";
  let partnerName = session?.partner_name || session?.partners?.name || "";
  if (!startDate && order.session_id) {
    const supa = getSupabaseServiceClient();
    const { data: sess } = await supa
      .from("sessions")
      .select("start_date,start_time,city,partner_name,partners(name,city)")
      .eq("id", order.session_id)
      .maybeSingle();
    if (sess?.start_date) startDate = sess.start_date;
    if (!city) city = sess?.city || (sess as any)?.partners?.city || "";
    if (!partnerName) partnerName = sess?.partner_name || (sess as any)?.partners?.name || "";
  }
  const startTime = session?.start_time || "";
  // Positionsname nur Anzahlung + Kurs
  const lineNameParts = ["Anzahlung", sessionTitle].filter(Boolean).join(" – ");
  // Beschreibung: Start / Partner / Ort (ohne technische IDs/Stripe)
  const lineDescriptionParts = [
    startDate ? `Start: ${startDate}${startTime ? " " + startTime : ""}` : null,
    partnerName ? `Partner: ${partnerName}` : null,
    city ? `Ort: ${city}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
  console.log("[zoho-sync] line data", {
    order: order.order_number,
    order_session_id: order.session_id,
    session_id: session?.id,
    course_id: order.course_id,
    startDate,
    startTime,
    partnerName,
    city,
    lineNameParts,
    lineDescriptionParts,
  });
  // Keine Zusatz-Anmerkungen in der Rechnung
  const notes = "";

  const taxId = await resolveZohoTaxId(taxPercentage);

  const grossRate = paidCents / 100;

  const invoicePayload: Record<string, unknown> = {
    customer_id: contactId,
    organization_id: ORG_ID,
    date: new Date(order.created_at).toISOString().slice(0, 10),
    due_date: new Date(order.created_at).toISOString().slice(0, 10),
    reference_number: order.order_number,
    is_inclusive_tax: taxPercentage > 0, // Preise sind brutto
    line_items: [
      {
        item_id: itemId,
        name: lineNameParts,
        description: lineDescriptionParts || notes,
        rate: grossRate, // Brutto-Preis, Zoho rechnet Steueranteil raus
        quantity: 1,
        is_taxable: taxPercentage > 0,
        tax_percentage: taxId ? undefined : taxPercentage,
        tax_id: taxId || undefined,
        tax_type: taxId ? undefined : "tax",
      },
    ],
    custom_fields: [],
    notes,
  } as any;

  const created = (await zohoRequest<{ invoice?: { invoice_id?: string } }>("/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-com-zoho-books-organizationid": ORG_ID },
    body: JSON.stringify(invoicePayload),
  })) as { invoice?: { invoice_id?: string } };

  const invoiceId = created?.invoice?.invoice_id;
  if (!invoiceId) throw new Error("invoice create failed");
  await persistInvoice(order.id, invoiceId);
  return invoiceId;
}

async function ensureZohoPayment(order: OrderWithJoins, invoiceId: string, paidCents: number): Promise<string> {
  if (order.zoho_payment_id) return order.zoho_payment_id;
  // Keine Doppelzahlung: versuchen, Payment per reference zu finden? (Zoho API hat keinen direkten Search; wir überspringen.)

  const payload = {
    customer_id: order.zoho_contact_id || undefined,
    amount: paidCents / 100,
    date: new Date(order.created_at).toISOString().slice(0, 10),
    payment_mode: "Stripe",
    reference_number: order.stripe_payment_intent || order.checkout_session_id || order.order_number,
    invoices: [{ invoice_id: invoiceId, amount_applied: paidCents / 100 }],
  };

  const created = (await zohoRequest<{ payment?: { payment_id?: string } }>("/customerpayments", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-com-zoho-books-organizationid": ORG_ID },
    body: JSON.stringify(payload),
  })) as { payment?: { payment_id?: string } };

  const paymentId = created?.payment?.payment_id;
  if (!paymentId) throw new Error("payment create failed");
  await persistPayment(order.id, paymentId);
  return paymentId;
}

// --- Persistence helpers ---
async function updateSessionItemId(sessionId: string | null, itemId: string) {
  if (!sessionId) return;
  const supabase = getSupabaseServiceClient();
  await supabase.from("sessions").update({ zoho_item_id: itemId, zoho_item_synced_at: new Date().toISOString(), zoho_item_sync_status: "synced" }).eq("id", sessionId);
}

async function persistInvoice(orderId: string, invoiceId: string) {
  const supabase = getSupabaseServiceClient();
  await supabase.from("orders").update({ zoho_invoice_id: invoiceId }).eq("id", orderId);
}

async function persistPayment(orderId: string, paymentId: string) {
  const supabase = getSupabaseServiceClient();
  await supabase.from("orders").update({ zoho_payment_id: paymentId }).eq("id", orderId);
}

// --- Zoho helpers ---
async function findContactByEmail(email: string): Promise<string | null> {
  const res = await zohoRequest<{ contacts?: Array<{ contact_id?: string }> }>(`/contacts?organization_id=${ORG_ID}&email=${encodeURIComponent(email)}`);
  return res?.contacts?.[0]?.contact_id || null;
}

async function findContactByName(name: string): Promise<string | null> {
  const res = await zohoRequest<{ contacts?: Array<{ contact_id?: string }> }>(`/contacts?organization_id=${ORG_ID}&contact_name=${encodeURIComponent(name)}`);
  return res?.contacts?.[0]?.contact_id || null;
}

async function createContact(payload: Record<string, unknown>): Promise<string> {
  const res = (await zohoRequest<{ contact?: { contact_id?: string } }>("/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-com-zoho-books-organizationid": ORG_ID },
    body: JSON.stringify(payload),
  })) as { contact?: { contact_id?: string } };
  const id = res?.contact?.contact_id;
  if (!id) throw new Error("contact create failed");
  return id;
}

async function findItemBySku(sku: string): Promise<string | null> {
  const res = await zohoRequest<{ items?: Array<{ item_id?: string; sku?: string }> }>(`/items?organization_id=${ORG_ID}&sku=${encodeURIComponent(sku)}`);
  return res?.items?.[0]?.item_id || null;
}

async function createItem(payload: Record<string, unknown>): Promise<string> {
  try {
    const res = (await zohoRequest<{ item?: { item_id?: string } }>("/items", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-com-zoho-books-organizationid": ORG_ID },
      body: JSON.stringify(payload),
    })) as { item?: { item_id?: string } };
    const id = res?.item?.item_id;
    if (!id) throw new Error("item create failed");
    return id;
  } catch (e: any) {
    const msg = e?.message || "";
    if (msg.includes("1001") || msg.toLowerCase().includes("schon existiert")) {
      // Item existiert bereits -> per Name/SKU suchen und reuse
      const name = (payload as any)?.name as string | undefined;
      const sku = (payload as any)?.sku as string | undefined;
      const found =
        (sku && (await findItemBySku(sku))) ||
        (name && (await findItemByName(name))) ||
        (name && (await findItemBySearch(name))) ||
        null;
      if (found) return found;
    }
    throw e;
  }
}

async function findInvoiceByReference(ref: string): Promise<string | null> {
  if (!ref) return null;
  const res = await zohoRequest<{ invoices?: Array<{ invoice_id?: string; reference_number?: string }> }>(
    `/invoices?organization_id=${ORG_ID}&reference_number=${encodeURIComponent(ref)}`
  );
  return res?.invoices?.[0]?.invoice_id || null;
}

async function findItemByName(name: string): Promise<string | null> {
  const res = await zohoRequest<{ items?: Array<{ item_id?: string; name?: string }> }>(
    `/items?organization_id=${ORG_ID}&name=${encodeURIComponent(name)}`
  );
  return res?.items?.[0]?.item_id || null;
}

async function findItemBySearch(term: string): Promise<string | null> {
  const res = await zohoRequest<{ items?: Array<{ item_id?: string; name?: string; sku?: string }> }>(
    `/items?organization_id=${ORG_ID}&search_text=${encodeURIComponent(term)}`
  );
  return res?.items?.[0]?.item_id || null;
}

const taxCache = new Map<number, string>();

async function resolveZohoTaxId(taxPercentage: number): Promise<string | null> {
  const pct = Math.round(Number(taxPercentage) * 1000) / 1000; // normalize
  if (!Number.isFinite(pct)) return null;

  // Env overrides (falls IDs hinterlegt)
  const map: Record<string, string | undefined> = {
    "20": process.env.ZOHO_TAX_ID_20_AT || process.env.ZOHO_TAX_ID_20,
    "0": process.env.ZOHO_TAX_ID_0_AT || process.env.ZOHO_TAX_ID_0,
    "19": process.env.ZOHO_TAX_ID_19_DE || process.env.ZOHO_TAX_ID_19,
  };
  const key = pct.toString().replace(/\.0+$/, "");
  if (map[key]) return map[key] || null;

  // Cache
  if (taxCache.has(pct)) return taxCache.get(pct)!;

  // Zoho nach Steuersätzen abfragen und per Prozentzahl matchen
  try {
    const res = await zohoRequest<{ taxes?: Array<{ tax_id?: string; tax_percentage?: number; tax_name?: string }> }>(`/settings/taxes`, {
      method: "GET",
      headers: { "X-com-zoho-books-organizationid": ORG_ID },
    });
    const taxes = res?.taxes || [];
    const found = taxes.find((t) => Math.round((Number(t.tax_percentage) || 0) * 1000) / 1000 === pct);
    if (found?.tax_id) {
      taxCache.set(pct, found.tax_id);
      return found.tax_id;
    }
  } catch (e) {
    console.warn("[zoho-sync] tax lookup failed", e);
  }

  return null;
}
