import "server-only";

import { sendMail } from "@/lib/mail";
import { getSupabaseServiceClient } from "@/lib/supabase";

type SendAutomationArgs = {
  key: string;
  to: string;
  locale?: string;
  tokens?: Record<string, string | number | null | undefined>;
  fallbackSubject?: string;
  fallbackHtml?: string;
  fallbackText?: string;
};

function applyTokens(input: string, tokens: Record<string, string | number | null | undefined>) {
  if (!input) return input;
  return input.replace(/{{\s*(\w+)\s*}}/g, (_, k) => {
    const val = tokens[k];
    if (val === null || val === undefined) return "";
    return String(val);
  });
}

/**
 * Zentraler Mailversand für Automationen.
 * - Holt Automation + Template (Locale-Fallback)
 * - Wendet Token-Replacements {{token}} an
 * - Loggt Erfolg/Fehler in automation_logs
 */
export async function sendAutomationMail({
  key,
  to,
  locale = "de-AT",
  tokens = {},
  fallbackSubject,
  fallbackHtml,
  fallbackText,
}: SendAutomationArgs) {
  const email = String(to).trim();
  if (!email.includes("@")) return { ok: false, error: "Ungültige E-Mail" };

  const hasCreds = process.env.GMAIL_USER && process.env.GMAIL_PASS;
  if (!hasCreds) return { ok: false, error: "Mail-Konfiguration fehlt (GMAIL_USER/GMAIL_PASS)" };

  const db = getSupabaseServiceClient();

  // Automation laden oder stub anlegen, damit sie im Dashboard erscheint
  let automation = null as { id: string; key: string; name: string; enabled: boolean } | null;
  try {
    const { data } = await db.from("automations").select("id,key,name,enabled").eq("key", key).maybeSingle();
    automation = data;
  } catch (e) {
    // ignore
  }

  if (!automation) {
    await db.from("automations").upsert({ key, name: key, trigger: "auto", enabled: true }, { onConflict: "key" });
    const { data } = await db.from("automations").select("id,key,name,enabled").eq("key", key).maybeSingle();
    automation = data;
  }

  if (!automation?.id) return { ok: false, error: "Automation nicht verfügbar" };
  if (!automation.enabled) return { ok: false, error: "Automation deaktiviert" };

  const { data: tplExact } = await db
    .from("automation_templates")
    .select("subject,html_body,text_body,locale")
    .eq("automation_id", automation.id)
    .eq("locale", locale)
    .maybeSingle();

  const { data: tplFallback } = tplExact
    ? { data: null }
    : await db
        .from("automation_templates")
        .select("subject,html_body,text_body,locale")
        .eq("automation_id", automation.id)
        .limit(1)
        .maybeSingle();

  const template = tplExact || tplFallback;

  let subject = template?.subject || fallbackSubject || `[${key}]`;
  let html = template?.html_body || fallbackHtml || "";
  let text = template?.text_body || fallbackText || "";

  if (!html && text) {
    html = `<pre style="font-family: Inter, Arial, sans-serif; white-space: pre-wrap; font-size:14px;">${text}</pre>`;
  }
  if (!html && !text) {
    html = `<p>(kein Inhalt hinterlegt)</p>`;
  }

  subject = applyTokens(subject, tokens);
  html = applyTokens(html, tokens);
  text = applyTokens(text, tokens);

  let ok = false;
  let error: string | undefined;
  try {
    await sendMail({ to: email, subject, html });
    ok = true;
  } catch (err: any) {
    error = err?.message || "send failed";
  }

  try {
    await db
      .from("automation_logs")
      .insert({ automation_id: automation.id, status: ok ? "success" : "error", recipient: email, subject, error_message: error });
  } catch (e) {
    // Logging darf Versand nicht blockieren
  }

  if (!ok) return { ok: false, error: error || "Versand fehlgeschlagen" };
  return { ok: true };
}
