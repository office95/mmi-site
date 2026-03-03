import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = url.hostname.toLowerCase();

  // Domain → Region Mapping
  const region = host.endsWith(".at") ? "AT" : host.endsWith(".de") ? "DE" : "AT";

  // Admin-Guard
  const isAdminRoute =
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/api/admin") ||
    url.pathname.startsWith("/partner-blog/create");

  let res = NextResponse.next();

  if (isAdminRoute) {
    const token = getAccessToken(req);
    const email = token ? extractEmail(token) : null;
    const allowed = email && ADMIN_EMAILS.includes(email);

    if (!allowed) {
      const redirectTo = `/login?redirect=${encodeURIComponent(url.pathname)}`;
      const redirect = NextResponse.redirect(new URL(redirectTo, req.url));
      redirect.cookies.set("region", region, { path: "/" });
      return redirect;
    }
  }

  res.headers.set("x-region", region);
  res.cookies.set("region", region, { path: "/" });
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/partner-blog/create", "/:path*"],
};

function extractEmail(jwt: string): string | null {
  try {
    const payload = jwt.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json?.email?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function getAccessToken(req: NextRequest): string | null {
  const authCookie = req.cookies
    .getAll()
    .find((c) => c.name.endsWith("auth-token") || c.name.includes("auth-token"));
  if (!authCookie) return null;
  try {
    const raw = decodeURIComponent(authCookie.value);
    const parsed = JSON.parse(raw);
    return parsed?.access_token || parsed?.accessToken || parsed?.token || null;
  } catch {
    return authCookie.value;
  }
}
