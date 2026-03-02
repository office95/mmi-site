import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = url.hostname.toLowerCase();

  // Domain → Region Mapping
  const region = host.endsWith(".at") ? "AT" : host.endsWith(".de") ? "DE" : "AT";

  const res = NextResponse.next();
  res.headers.set("x-region", region);
  res.cookies.set("region", region, { path: "/" });
  return res;
}

export const config = {
  matcher: ["/:path*"],
};
