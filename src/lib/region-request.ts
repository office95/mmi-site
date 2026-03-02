import type { NextRequest } from "next/server";

export function getRegionFromRequest(req: NextRequest): "AT" | "DE" {
  try {
    const host = req.nextUrl.hostname.toLowerCase();
    if (host.endsWith(".de")) return "DE";
    if (host.endsWith(".at")) return "AT";
    const header = req.headers.get("x-region")?.toUpperCase();
    if (header === "AT" || header === "DE") return header;
    const cookie = req.cookies.get("region")?.value?.toUpperCase();
    if (cookie === "AT" || cookie === "DE") return cookie;
  } catch {}
  return "AT";
}
