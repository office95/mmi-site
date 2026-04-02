import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const { id, role = "employee", status = "approved" } = body ?? {};
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const normalizedRole = role === "admin" ? "admin" : "employee";
  const normalizedStatus = status === "blocked" ? "blocked" : status === "approved" ? "approved" : "pending";

  const supabase = getSupabaseServiceClient();

  // Update Profile role/status
  const { error: profileError } = await supabase.from("profiles").upsert(
    { user_id: id, role: normalizedRole, status: normalizedStatus, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  // Ensure auth user exists (optional email_confirm stays as is)
  const { error: authError } = await supabase.auth.admin.updateUserById(id, {
    user_metadata: {
      role: normalizedRole,
      status: normalizedStatus,
    },
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
