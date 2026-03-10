import { NextRequest, NextResponse } from "next/server";
import { requireZohoConfigured, zohoRequest, ZOHO_ORG_ID } from "@/lib/zohoBooks";

// GET /api/zoho/contacts?page=1&per_page=50
export async function GET(req: NextRequest) {
  const err = requireZohoConfigured();
  if (err) return err;

  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "50";

  try {
    const data = await zohoRequest(`/contacts?organization_id=${ZOHO_ORG_ID}&page=${page}&per_page=${perPage}`);
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error("Zoho contacts error", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
