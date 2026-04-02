import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "SERVICE_ROLE_KEY or SUPABASE_URL missing" }, { status: 500 });
  }
  if (!key.startsWith("eyJ")) {
    return NextResponse.json({ error: "SERVICE_ROLE_KEY looks invalid (expected JWT starting with eyJ…)" }, { status: 500 });
  }

  const supabase = getSupabaseServiceClient();

  // 1) hole alle Profile (role/status)
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, role, status");
  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });
  const profileMap = new Map<string, { role: string | null; status: string | null }>();
  profiles?.forEach((p) => profileMap.set(p.user_id, { role: p.role, status: p.status }));

  // 2) hole alle Auth-User (Email + Timestamps)
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const merged = data.users.map((u) => {
    const profile = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      role: profile?.role ?? "employee",
      status: profile?.status ?? "pending",
    };
  });

  return NextResponse.json({ data: merged });
}
