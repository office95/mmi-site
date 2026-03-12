import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { sendMail } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const logId = body?.log_id as string | undefined;
  if (!logId) return NextResponse.json({ error: "log_id required" }, { status: 400 });

  const db = getSupabaseServiceClient();
  const { data: log, error } = await db
    .from("automation_logs")
    .select("id,automation_id,automation_key,recipient,subject,html_preview,text_preview,locale,context_type,context_id")
    .eq("id", logId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!log) return NextResponse.json({ error: "log not found" }, { status: 404 });

  const html = log.html_preview || (log.text_preview ? `<pre>${log.text_preview}</pre>` : "<p>(kein Inhalt gespeichert)</p>");
  try {
    await sendMail({ to: log.recipient, subject: log.subject || "[Resend]", html });
    await db.from("automation_logs").insert({
      automation_id: log.automation_id,
      automation_key: log.automation_key,
      locale: log.locale,
      status: "success",
      recipient: log.recipient,
      subject: log.subject,
      context_type: log.context_type,
      context_id: log.context_id,
      html_preview: log.html_preview,
      text_preview: log.text_preview,
      template_version: "resend",
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const message = e?.message || "resend failed";
    await db.from("automation_logs").insert({
      automation_id: log.automation_id,
      automation_key: log.automation_key,
      locale: log.locale,
      status: "error",
      recipient: log.recipient,
      subject: log.subject,
      context_type: log.context_type,
      context_id: log.context_id,
      html_preview: log.html_preview,
      text_preview: log.text_preview,
      template_version: "resend",
      error_message: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
