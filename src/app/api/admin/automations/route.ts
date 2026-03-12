import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function GET() {
  const db = getSupabaseServiceClient();
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
  // Testmail stub
  return NextResponse.json({ ok: true, note: "Testmodus: Versandstub" });
}
