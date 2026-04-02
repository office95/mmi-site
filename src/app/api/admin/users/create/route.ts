import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, password, role = "employee" } = body as {
    email?: string;
    password?: string;
    role?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "email und password sind erforderlich" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  // create auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) return NextResponse.json({ error: error?.message || "createUser failed" }, { status: 500 });

  // set role/status in profiles
  const { error: profileError } = await supabase.from("profiles").upsert(
    { user_id: data.user.id, role, status: "approved", updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ ok: true, user: data.user });
}
