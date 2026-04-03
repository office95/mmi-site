import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

const TABLE = "courses";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id?: string }> }) {
  const { id } = await params;
  const courseId = id ?? new URL(req.url).pathname.split("/").pop();
  if (!courseId || courseId === "undefined") {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*, sessions(*), addons(*), course_tags(tag:tags(name))")
    .eq("id", courseId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  type CourseRow = {
    tags?: string[] | null;
    course_tags?: Array<{ tag?: { name?: string | null } | null }> | null;
    sessions?: unknown[] | null;
    addons?: unknown[] | null;
    faqs?: unknown[] | null;
    modules?: unknown[] | null;
    [key: string]: unknown;
  };
  const row = data as CourseRow;
  const mapped = {
    ...row,
    tags: Array.from(
      new Set(
        [
          ...((row.course_tags ?? []).map((t) => t.tag?.name).filter(Boolean) ?? []),
          ...((row.tags ?? []).filter(Boolean) ?? []),
        ]
          .map((t) => (typeof t === "string" ? t.trim() : ""))
          .filter(Boolean)
      )
    ),
    sessions: row.sessions ?? [],
    addons: row.addons ?? [],
    faqs: row.faqs ?? [],
    modules: row.modules ?? [],
  };
  return NextResponse.json({ data: mapped });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id?: string }> }) {
  const { id } = await params;
  const courseId = id ?? new URL(req.url).pathname.split("/").pop();
  if (!courseId || courseId === "undefined") {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  try {
    const del = async (table: string, column = "course_id") => {
      const { error } = await supabase.from(table).delete().eq(column, courseId);
      if (error) throw error;
    };

    await del("course_tags");
    await del("sessions");
    await del("addons");
    await del(TABLE, "id");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
