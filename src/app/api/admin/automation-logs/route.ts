import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);
  const offset = Number(url.searchParams.get("offset")) || 0;
  const automationKey = url.searchParams.get("automation_key");
  const status = url.searchParams.get("status");
  const recipient = url.searchParams.get("recipient");
  const search = url.searchParams.get("search");
  const contextId = url.searchParams.get("context_id");

  const db = getSupabaseServiceClient();
  let query = db
    .from("automation_logs")
    .select(
      "id,automation_id,automation_key,locale,status,recipient,subject,error_message,sent_at,context_type,context_id,html_preview,text_preview"
    )
    .order("sent_at", { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (automationKey) query = query.eq("automation_key", automationKey);
  if (status) query = query.eq("status", status);
  if (recipient) query = query.ilike("recipient", `%${recipient}%`);
  if (contextId) query = query.eq("context_id", contextId);
  if (search) {
    query = query.or(`subject.ilike.%${search}%,recipient.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, nextOffset: offset + data.length, hasMore: data.length === limit });
}
