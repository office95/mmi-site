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
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data.users });
}
