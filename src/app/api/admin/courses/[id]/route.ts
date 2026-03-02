import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

const TABLE = "courses";
export const dynamic = "force-dynamic";

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
