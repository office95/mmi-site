import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const FORMS = "forms";
const FIELDS = "form_fields";

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from(FORMS)
    .select("*, form_fields(*)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const mapped =
    data?.map((f: any) => ({
      ...f,
      form_fields: (f.form_fields ?? []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    })) ?? [];
  return NextResponse.json({ data: mapped });
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = getSupabaseServiceClient();

  const formId = body.id ?? randomUUID();
  const formPayload = {
    id: formId,
    title: body.title,
    description: body.description ?? null,
    require_terms: body.require_terms ?? false,
    terms_url: body.terms_url ?? null,
    is_live: body.is_live ?? false,
    updated_at: new Date().toISOString(),
  };

  const { error: formErr } = await supabase.from(FORMS).upsert(formPayload, { onConflict: "id" });
  if (formErr) return NextResponse.json({ error: formErr.message }, { status: 500 });

  if (Array.isArray(body.fields)) {
    await supabase.from(FIELDS).delete().eq("form_id", formId);
    const toInsert = body.fields
      .filter((f: any) => f.label)
      .map((f: any, idx: number) => ({
        id: f.id ?? randomUUID(),
        form_id: formId,
        label: f.label,
        type: f.type,
        options: f.options ?? [],
        required: f.required ?? false,
        sort_order: f.sort_order ?? idx,
        placeholder: f.placeholder ?? null,
        width: f.width ?? null,
      }));
    if (toInsert.length) {
      const { error: fieldErr } = await supabase.from(FIELDS).insert(toInsert);
      if (fieldErr) return NextResponse.json({ error: fieldErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, id: formId });
}

export async function DELETE(req: Request) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from(FORMS).delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
