import { NextResponse } from "next/server";
import { GET as marketingGet } from "@/app/api/admin/marketing/route";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Wiederverwendung der Business-Logik aus dem Admin-Endpoint.
  // In Produktion kann dieser Handler per Cron (HTTP Ping) aufgerufen werden.
  const res = await marketingGet(req as any);
  const json = (await (res as any).json()) as any;

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    summary: (json?.data ?? []).map((c: any) => ({ courseId: c.courseId, status: c.status, next: c.plan?.[0] ?? null })),
  });
}

