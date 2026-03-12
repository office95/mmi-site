import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { sendAutomationMail } from "@/lib/automationMailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const FALLBACK_FORM_ID = "a6b28590-9885-42e8-a460-9ffd27b59ae3";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params;
  const body = await req.json();
  const supabase = getSupabaseServiceClient();
  const formId = paramId && paramId !== "undefined" ? paramId : FALLBACK_FORM_ID;

  // ensure form is live
  const { data: form, error: formErr } = await supabase
    .from("forms")
    .select("id, is_live, require_terms")
    .eq("id", formId)
    .eq("is_live", true)
    .maybeSingle();
  if (formErr) return NextResponse.json({ error: formErr.message }, { status: 500 });
  if (!form) return NextResponse.json({ error: "Form not found or not live" }, { status: 404 });

  if (form.require_terms && !body.accept_terms) {
    return NextResponse.json({ error: "Terms must be accepted" }, { status: 400 });
  }

  const submissionId = randomUUID();
  const { error: subErr } = await supabase.from("form_submissions").insert({
    id: submissionId,
    form_id: formId,
    ip: body.ip ?? null,
    user_agent: body.ua ?? null,
  });
  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

  const answersArray: any[] = [];
  if (Array.isArray(body.answers)) {
    body.answers.forEach((a: any) => {
      if (!a.field_id) return;
      if (Array.isArray(a.value_multi)) {
        answersArray.push({ submission_id: submissionId, field_id: a.field_id, value_multi: a.value_multi });
      } else {
        answersArray.push({ submission_id: submissionId, field_id: a.field_id, value: a.value ?? null });
      }
    });
  }

  if (answersArray.length) {
    const { error: ansErr } = await supabase.from("form_answers").insert(answersArray);
    if (ansErr) return NextResponse.json({ error: ansErr.message }, { status: 500 });
  }

  // Notify via Automation (best effort)
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005";
    const adminLink = `${base}/admin/forms`;

    // fetch field labels for nicer email rendering
    const { data: fieldsData } = await supabase
      .from("form_fields")
      .select("id,label,type,sort_order")
      .eq("form_id", formId)
      .order("sort_order", { ascending: true });

    const valueMap = new Map<string, string>();
    answersArray.forEach((a) => {
      const val = Array.isArray(a.value_multi) ? a.value_multi.join(", ") : (a.value ?? "");
      valueMap.set(a.field_id as string, val);
    });

    const sections: string[] = [];
    (fieldsData ?? []).forEach((f: any) => {
      const label = f.label || "";
      const type = f.type || "";
      const val = valueMap.get(f.id) ?? "";

      if (type === "heading" || type === "subheading") {
        sections.push(
          `<div style="margin-top:14px;margin-bottom:6px;font-weight:700;font-size:${type === "heading" ? "16px" : "14px"};color:#0f172a;">${label}</div>`
        );
        return;
      }

      const isCheckbox = type === "checkbox";
      const hasValue = isCheckbox ? val === "true" : val.trim().length > 0;
      if (!hasValue) return;

      sections.push(
        `<div style="padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:6px;background:#fff;max-width:520px;">
          <div style="font-weight:600;color:#0f172a;font-size:12px;margin-bottom:3px;">${label}</div>
          <div style="font-size:12px;color:#334155;line-height:1.35;">${isCheckbox ? "✓ Ja" : val}</div>
        </div>`
      );
    });

    const answersHtml = sections.join("");

    await sendAutomationMail({
      key: "form_submit_notification",
      to: "office@musicmission.at",
      tokens: {
        form_id: formId,
        submission_id: submissionId,
        admin_link: adminLink,
      },
      fallbackSubject: "Formular eingereicht",
      fallbackHtml: `<p>Ein Formular wurde soeben eingereicht.</p>
             <p><strong>Formular-ID:</strong> {{form_id}}<br/>
             <strong>Submission:</strong> {{submission_id}}</p>
             <p><a href="{{admin_link}}" target="_blank" rel="noreferrer">Zum Formular / Admin-Dashboard</a></p>
             <p style="margin-top:12px;font-weight:700;color:#0f172a;">Antworten</p>
             <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px;background:#f8fafc;">
               ${answersHtml || "<em>Keine Angaben</em>"}
             </div>`,
    });
  } catch (e) {
    console.error("Mail send failed", e);
  }

  return NextResponse.json({ ok: true, submission_id: submissionId });
}
