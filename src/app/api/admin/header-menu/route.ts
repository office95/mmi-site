import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SLOT_INTENSIV = "00000000-0000-0000-0000-000000000102";
const SLOT_EXTREM = "00000000-0000-0000-0000-000000000103";
const SLOT_LABELS: Record<string, string> = {
  [SLOT_INTENSIV]: "Intensiv-Ausbildungen",
  [SLOT_EXTREM]: "Extremkurse",
};

type SlotPayload = { id: string; courses: { id: string; sort_order?: number }[] };

// GET: Slots + Kurse
export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("header_slots")
    .select(
      `
      id,label,sort_order,
      header_slot_courses(
        sort_order,
        courses!inner(id,slug,title)
      )
    `
    )
    .in("id", [SLOT_INTENSIV, SLOT_EXTREM])
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // @ts-expect-error Supabase typing mismatch; we normalize manually
  const slots: any[] = (data ?? []).map((s: any) => {
    const slotsCourses: any[] = Array.isArray(s?.header_slot_courses) ? s.header_slot_courses : [];
    const courses =
      slotsCourses
        .sort((a: any, b: any) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0))
        .flatMap((c: any) => {
          const list = Array.isArray(c?.courses) ? c.courses : c?.courses ? [c.courses] : [];
          return list.map((course: any) => ({
            id: course?.id ?? "",
            slug: course?.slug ?? "",
            title: course?.title ?? "",
            sort_order: c?.sort_order ?? 0,
          }));
        }) ?? [];
    return { id: s?.id ?? "", label: s?.label ?? "", courses };
  });

  return NextResponse.json({ data: slots });
}

// PUT: Zuordnung speichern
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const slots = (body?.slots as SlotPayload[]) ?? [];
    const supabase = getSupabaseServiceClient();

    // Sicherstellen, dass Slots existieren
    const upsertRows = [
      { id: SLOT_INTENSIV, label: SLOT_LABELS[SLOT_INTENSIV], sort_order: 0 },
      { id: SLOT_EXTREM, label: SLOT_LABELS[SLOT_EXTREM], sort_order: 1 },
    ];
    const { error: upErr } = await supabase.from("header_slots").upsert(upsertRows, { onConflict: "id" });
    if (upErr) return NextResponse.json({ error: upErr.message, hint: "upsert slots" }, { status: 500 });

    // Nur diese Slots anfassen
    const slotIds = [SLOT_INTENSIV, SLOT_EXTREM];
    const { error: delErr } = await supabase.from("header_slot_courses").delete().in("slot_id", slotIds);
    if (delErr) return NextResponse.json({ error: delErr.message, hint: "delete mappings" }, { status: 500 });

    const mappings: { slot_id: string; course_id: string; sort_order: number }[] = [];
    slots.forEach((s) => {
      if (!slotIds.includes(s.id)) return;
      (s.courses ?? []).forEach((c, idx) => {
        if (c.id) mappings.push({ slot_id: s.id, course_id: c.id, sort_order: c.sort_order ?? idx });
      });
    });

    if (mappings.length) {
      const { error: insErr } = await supabase.from("header_slot_courses").insert(mappings);
      if (insErr) return NextResponse.json({ error: insErr.message, hint: "insert mappings" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, saved: mappings.length });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
