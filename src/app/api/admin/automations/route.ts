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

const defaultTemplates: Record<
  string,
  { locale: string; subject: string; html_body: string; text_body?: string }
> = {
  order_admin_new_booking: {
    locale: "de-AT",
    subject: "Du hast eine neue Buchung",
    html_body: `
      <h3>Du hast eine neue Buchung</h3>
      <p><strong>Kurs:</strong> {{course_title}}</p>
      <p><strong>Termin:</strong> {{start_date}} {{start_time}}</p>
      <p><strong>Partner:</strong> {{partner_name}} ({{partner_city}})</p>
      <p><strong>Teilnehmer (Anzahl):</strong> {{participants}}</p>
      <p><strong>Kursteilnehmer:</strong> {{customer_contact}}</p>
      <p><strong>Order:</strong> {{order_number}}</p>
      <p><a href="{{order_link}}" target="_blank" rel="noreferrer">Zur Bestellung</a></p>
    `,
  },
  order_customer_confirmation: {
    locale: "de-AT",
    subject: "Buchungsbestätigung",
    html_body: `<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; color:#111; margin:0; padding:24px; background:#f7f7f8; }
    .card { max-width:700px; margin:auto; background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:28px; }
    h1 { font-size:22px; margin:0 0 12px; }
    h2 { font-size:16px; margin:22px 0 10px; }
    p { line-height:1.6; margin:0 0 12px; }
    ul { padding-left:18px; margin:0; }
    li { margin:4px 0; }
    .muted { color:#555; font-size:14px; }
    .divider { border-top:1px solid #e5e7eb; margin:20px 0; }
    a { color:#0d6efd; text-decoration:none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Buchungsbestätigung – {{kursname}} am {{terminDatum}}</h1>
    <p>Hallo {{anredeVorname}},</p>
    <p>vielen Dank für deine Buchung. Dein Platz ist fix reserviert:</p>

    <h2>Buchungsdetails</h2>
    <ul>
      <li><strong>Kurs:</strong> {{kursname}}</li>
      <li><strong>Kursstart:</strong> {{terminZeile}}</li>
      <li><strong>Kursort:</strong> {{ortZeile}}</li>
      <li><strong>Teilnehmer/in:</strong> {{teilnehmerName}}</li>
      <li><strong>Buchungsnummer:</strong> {{buchungsnummer}}</li>
    </ul>

    <h2>Zahlung & Betrag</h2>
    <ul>
      <li><strong>Gesamtpreis (brutto):</strong> {{gesamtpreisEur}}</li>
      <li><strong>Bereits bezahlt (Anzahlung):</strong> {{bereitsBezahltEur}} am {{zahlungsdatum}} per {{zahlungsart}}</li>
      <li><strong>Offener Betrag:</strong> {{offenerBetragEur}} (fällig zum Kursstart)</li>
    </ul>

    <div class="divider"></div>

    <h2>Hinweise</h2>
    <p class="muted">
      Diese Buchungsbestätigung ist keine Rechnung.<br/>
      Die Anzahlungsrechnung über die bereits geleistete Zahlung erhältst du separat.<br/>
      Nach Kursende stellen wir eine Schlussrechnung über den Gesamtbetrag abzüglich der Anzahlung aus.<br/>
      Es gelten unsere AGB und Stornobedingungen: <a href="{{linkAgb}}">AGB &amp; Storno</a>.
    </p>

    <h2>Firmenangaben</h2>
    <p class="muted">
      {{firmenzeile}}<br/>
      {{telefonzeile}}<br/>
      UID {{uidNr}}{{firmenbuchNr_line}}
    </p>

    <p>Wir freuen uns auf deine Teilnahme!<br/>
    Freundliche Grüße<br/>
    {{absenderName}}</p>
  </div>
</body>
</html>`,
  },
};

export async function GET() {
  const db = getSupabaseServiceClient();
  // Seed defaults if missing
  try {
    for (const def of defaults) {
      await db.from("automations").insert({ ...def }).onConflict("key").ignore();
    }
  } catch (e) {
    // ignore seed errors
  }
  const { data: automations, error } = await db
    .from("automations")
    .select("id,key,name,trigger,enabled,updated_at,updated_by")
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Seed default templates if missing
  try {
    for (const auto of automations ?? []) {
      const tpl = defaultTemplates[auto.key];
      if (!tpl) continue;
      const { data: existing } = await db
        .from("automation_templates")
        .select("id,subject,html_body,text_body")
        .eq("automation_id", auto.id)
        .eq("locale", tpl.locale)
        .maybeSingle();
      if (!existing) {
        await db.from("automation_templates").insert({ automation_id: auto.id, ...tpl });
      } else if (!existing.subject && !existing.html_body && !existing.text_body) {
        await db.from("automation_templates").update({ subject: tpl.subject, html_body: tpl.html_body, text_body: tpl.text_body }).eq("id", existing.id);
      }
    }
  } catch (e) {
    // ignore template seed errors
  }

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
