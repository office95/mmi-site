import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { sendMail } from "@/lib/mail";

const defaults = [
  { key: "order_admin_new_booking", name: "Admin: Neue Buchung", trigger: "Stripe webhook payment_intent.succeeded", enabled: true },
  { key: "order_customer_confirmation", name: "Kunde: Buchungsbestätigung", trigger: "Stripe webhook payment_intent.succeeded", enabled: true },
  { key: "order_paid", name: "Kunde: Zahlung bestätigt", trigger: "order.status=paid (Webhook)", enabled: true },
  { key: "order_pending_reminder", name: "Kunde: Buchung offen – Reminder", trigger: "Cron: pending >24h", enabled: true },
  { key: "diploma_application_admin", name: "Admin: Diploma-Anmeldung", trigger: "POST /api/diploma/apply", enabled: true },
  { key: "diploma_application_customer", name: "Kunde: Diploma-Eingangsbestätigung", trigger: "POST /api/diploma/apply", enabled: true },
  { key: "form_submit_notification", name: "Admin: Formulareingang", trigger: "POST /api/forms/[id]/submit", enabled: true },
];

export async function GET() {
  const db = getSupabaseServiceClient();
  // Seed defaults if missing
  try {
    for (const def of defaults) {
      await db.from("automations").upsert({ ...def }, { onConflict: "key" });
    }
  } catch (e) {
    // ignore seed errors
  }
  const { data: automations, error } = await db
    .from("automations")
    .select("id,key,name,trigger,enabled,updated_at,updated_by")
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (automations ?? []).map((a: any) => a.id);
  const { data: templates } = ids.length
    ? await db.from("automation_templates").select("automation_id,locale,subject,html_body,text_body,updated_at").in("automation_id", ids)
    : { data: [] };
  const { data: logs } = ids.length
    ? await db
        .from("automation_logs")
        .select("automation_id,status,recipient,subject,sent_at,error_message")
        .in("automation_id", ids)
        .order("sent_at", { ascending: false })
        .limit(1)
    : { data: [] };

  const groupedTemplates = new Map<string, any[]>();
  (templates ?? []).forEach((t: any) => {
    const list = groupedTemplates.get(t.automation_id) || [];
    list.push(t);
    groupedTemplates.set(t.automation_id, list);
  });
  const groupedLog = new Map<string, any>();
  (logs ?? []).forEach((l: any) => {
    if (!groupedLog.has(l.automation_id)) groupedLog.set(l.automation_id, l);
  });

  const result = (automations ?? []).map((a: any) => ({
    ...a,
    templates: groupedTemplates.get(a.id) ?? [],
    last_log: groupedLog.get(a.id) ?? null,
  }));

  return NextResponse.json({ data: result });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id, enabled, subject, html_body, text_body, locale = "de-AT" } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const db = getSupabaseServiceClient();

  if (typeof enabled === "boolean") {
    const { error } = await db.from("automations").update({ enabled }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (subject !== undefined || html_body !== undefined || text_body !== undefined) {
    const payload: any = { subject, html_body, text_body };
    const { error } = await db
      .from("automation_templates")
      .upsert({ automation_id: id, locale, ...payload, updated_at: new Date().toISOString() }, { onConflict: "automation_id,locale" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id, to, locale = "de-AT" } = body as { id?: string; to?: string; locale?: string };
  if (!id || !to) return NextResponse.json({ error: "id und to sind erforderlich" }, { status: 400 });

  const email = String(to).trim();
  if (!email.includes("@")) return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 });

  const hasMailCreds = process.env.GMAIL_USER && process.env.GMAIL_PASS;
  if (!hasMailCreds) {
    return NextResponse.json({ error: "Mailversand nicht konfiguriert (GMAIL_USER/GMAIL_PASS fehlen)" }, { status: 400 });
  }

  const db = getSupabaseServiceClient();

  const { data: automation, error: autoError } = await db
    .from("automations")
    .select("id,key,name,enabled")
    .eq("id", id)
    .maybeSingle();
  if (autoError) return NextResponse.json({ error: autoError.message }, { status: 500 });
  if (!automation) return NextResponse.json({ error: "Automation nicht gefunden" }, { status: 404 });
  if (!automation.enabled)
    return NextResponse.json({ error: "Automation ist inaktiv – bitte aktivieren" }, { status: 400 });

  const { data: tplExact, error: tplError } = await db
    .from("automation_templates")
    .select("subject,html_body,text_body,locale")
    .eq("automation_id", id)
    .eq("locale", locale)
    .maybeSingle();
  if (tplError) return NextResponse.json({ error: tplError.message }, { status: 500 });

  const { data: tplFallback } = tplExact
    ? { data: null }
    : await db
        .from("automation_templates")
        .select("subject,html_body,text_body,locale")
        .eq("automation_id", id)
        .limit(1)
        .maybeSingle();

  const template = tplExact || tplFallback;
  if (!template) return NextResponse.json({ error: "Kein Template hinterlegt" }, { status: 400 });

  const subject = template.subject || `[${automation.key}] Testversand`;
  const html =
    template.html_body ||
    (template.text_body
      ? `<pre style="font-family: Inter, Arial, sans-serif; white-space: pre-wrap; font-size:14px;">${template.text_body}</pre>`
      : "<p>(kein Inhalt hinterlegt)</p>");

  try {
    await sendMail({ to: email, subject, html });
    await db.from("automation_logs").insert({ automation_id: id, status: "success", recipient: email, subject });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    await db
      .from("automation_logs")
      .insert({ automation_id: id, status: "error", recipient: email, subject, error_message: err?.message || "send failed" });
    return NextResponse.json({ error: "Testversand fehlgeschlagen" }, { status: 500 });
  }
}
