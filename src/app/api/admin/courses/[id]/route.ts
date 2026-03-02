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

  const step = async (fn: () => Promise<{ error: any }>) => {
    const result = await fn();
    const error = (result as any)?.error;
    if (error) throw error;
  };

  try {
    await step(() => supabase.from("course_tags").delete().eq("course_id", courseId));
    await step(() => supabase.from("sessions").delete().eq("course_id", courseId));
    await step(() => supabase.from("addons").delete().eq("course_id", courseId));
    await step(() => supabase.from(TABLE).delete().eq("id", courseId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
