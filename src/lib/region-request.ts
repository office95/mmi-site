import type { NextRequest } from "next/server";

export function getRegionFromRequest(req: NextRequest): "AT" | "DE" {
  try {
    const param = req.nextUrl.searchParams.get("region")?.toUpperCase();
    if (param === "AT" || param === "DE") return param;

    const cookie = req.cookies.get("region")?.value?.toUpperCase();
    if (cookie === "AT" || cookie === "DE") return cookie;

    const header = req.headers.get("x-region")?.toUpperCase();
    if (header === "AT" || header === "DE") return header;

    const host = req.nextUrl.hostname.toLowerCase();
    if (host.endsWith(".de")) return "DE";
    if (host.endsWith(".at")) return "AT";
  } catch {}
  return "AT";
}
