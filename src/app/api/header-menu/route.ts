import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SLOT_INTENSIV = "00000000-0000-0000-0000-000000000102";
const SLOT_EXTREM = "00000000-0000-0000-0000-000000000103";

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

  const slots =
    ((data as unknown as any[]) ?? []).map((s: any) => {
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
      return {
        id: s?.id ?? "",
        label: s?.label ?? "",
        sort_order: s?.sort_order ?? 0,
        courses,
      };
    });

  return NextResponse.json({ data: slots });
}
