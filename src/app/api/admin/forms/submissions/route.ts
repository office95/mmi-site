import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const formId = searchParams.get("formId");
  if (!formId) return NextResponse.json({ error: "formId required" }, { status: 400 });

  const supabase = getSupabaseServiceClient();

  // try with archived column; if missing, retry without
  let submissionsRes = await supabase
    .from("form_submissions")
    .select("id, created_at, form_id, ip, user_agent, archived")
    .eq("form_id", formId)
    .order("created_at", { ascending: false });
  if (submissionsRes.error && submissionsRes.error.code === "42703") {
    submissionsRes = await supabase
      .from("form_submissions")
      .select("id, created_at, form_id, ip, user_agent")
      .eq("form_id", formId)
      .order("created_at", { ascending: false });
  }
  if (submissionsRes.error) return NextResponse.json({ error: submissionsRes.error.message }, { status: 500 });
  const submissions = (submissionsRes.data ?? []).map((s: any) => ({ archived: false, ...s }));

  const submissionIds = submissions?.map((s) => s.id) ?? [];
  let answers: {
    submission_id: string;
    field_id: string;
    value: string | null;
    value_multi: string[] | null;
    form_fields: { label: string | null; type: string | null } | null;
  }[] = [];
  if (submissionIds.length) {
    const { data: ans, error: ansErr } = await supabase
      .from("form_answers")
      .select("submission_id, field_id, value, value_multi, form_fields(label, type)")
      .in("submission_id", submissionIds);
    if (ansErr) return NextResponse.json({ error: ansErr.message }, { status: 500 });
    answers = ans ?? [];
  }

  const grouped = submissions.map((s) => ({
    ...s,
    answers: answers
      .filter((a) => a.submission_id === s.id)
      .map((a) => ({
        field_id: a.field_id,
        label: a.form_fields?.label ?? "",
        type: a.form_fields?.type ?? "",
        value: a.value_multi ?? a.value ?? "",
      })),
  }));

  return NextResponse.json({ data: grouped });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  if (!body.id || typeof body.archived !== "boolean") {
    return NextResponse.json({ error: "id and archived required" }, { status: 400 });
  }
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("form_submissions").update({ archived: body.archived }).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
