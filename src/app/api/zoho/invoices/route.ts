import { NextRequest, NextResponse } from "next/server";
import { requireZohoConfigured, zohoRequest, ZOHO_ORG_ID } from "@/lib/zohoBooks";

// POST /api/zoho/invoices  (body forwarded to Zoho Books)
export async function POST(req: NextRequest) {
  const err = requireZohoConfigured();
  if (err) return err;
  const payload = await req.json();
  try {
    const data = await zohoRequest(`/invoices?organization_id=${ZOHO_ORG_ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error("Zoho invoice error", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
