import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Löscht Partner, Kurse und alle Stammdaten inkl. abhängiger Tabellen
export async function POST() {
  const supabase = getSupabaseServiceClient();

  const tablesInOrder = [
    "order_addons",
    "orders",
    "course_tags",
    "tags",
    "addons",
    "sessions",
    "courses",
    "instructors",
    "partners",
    "course_types",
    "course_languages",
    "course_levels",
    "course_formats",
    "course_categories",
  ];

  for (const table of tablesInOrder) {
    const { error } = await supabase.from(table).delete().neq("id", null);
    if (error) return NextResponse.json({ error: `Delete ${table}: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
