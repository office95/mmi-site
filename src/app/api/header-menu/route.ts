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
    data?.map((s) => ({
      id: s.id,
      label: s.label,
      sort_order: s.sort_order ?? 0,
      courses:
        (s as {
          header_slot_courses?: {
            sort_order?: number;
            courses: { id: string; slug: string; title: string };
          }[];
        }).header_slot_courses
          ?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          ?.map((c) => ({
            id: c.courses.id,
            slug: c.courses.slug,
            title: c.courses.title,
            sort_order: c.sort_order ?? 0,
          })) ?? [],
    })) ?? [];

  return NextResponse.json({ data: slots });
}
