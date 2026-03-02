import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServiceClient();

  // try to include archived column; fallback if missing
  let subsRes = await supabase
    .from("form_submissions")
    .select("id, created_at, form_id, ip, user_agent, archived")
    .order("created_at", { ascending: false });
  if (subsRes.error && subsRes.error.code === "42703") {
    subsRes = await supabase.from("form_submissions").select("id, created_at, form_id, ip, user_agent").order("created_at", { ascending: false });
  }
  if (subsRes.error) return NextResponse.json({ error: subsRes.error.message }, { status: 500 });
  const submissions = (subsRes.data ?? []).map((s: any) => ({ archived: false, ...s }));

  const ids = submissions.map((s) => s.id);
  let answersRes = { data: [], error: null } as any;
  if (ids.length) {
    answersRes = await supabase
      .from("form_answers")
      .select("submission_id, field_id, value, value_multi, form_fields(label, type)")
      .in("submission_id", ids);
    if (answersRes.error) return NextResponse.json({ error: answersRes.error.message }, { status: 500 });
  }
  const answers = answersRes.data ?? [];

  const grouped = submissions.map((s) => ({
    ...s,
    answers: answers
      .filter((a: any) => a.submission_id === s.id)
      .map((a: any) => ({
        field_id: a.field_id,
        label: a.form_fields?.label ?? "",
        type: a.form_fields?.type ?? "",
        value: a.value_multi ?? a.value ?? "",
      })),
  }));

  return NextResponse.json({ data: grouped });
}
