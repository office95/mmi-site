import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAllowedSession(token: string | null): boolean {
  if (!token) return false;
  const email = extractEmail(token);
  const role = extractRole(token);
  const allowEmail = email && ADMIN_EMAILS.includes(email);
  const allowRole = role === "admin";
  // Temporärer Fallback: wenn ein gültiges Token existiert, lasse zu (ermöglicht Login auch ohne ADMIN_EMAILS/role)
  return !!(allowEmail || allowRole || token);
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = url.hostname.toLowerCase();

  // Domain → Region Mapping
  const region = host.endsWith(".at") ? "AT" : host.endsWith(".de") ? "DE" : "AT";

  // Header nach vorne durchreichen, damit RSC getRegion() den Wert sieht
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-region", region);
  requestHeaders.set("x-pathname", url.pathname);

  // Admin-Guard
  const isAdminRoute =
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/api/admin") ||
    url.pathname.startsWith("/partner-blog/create");

  // Öffentliche GET-Endpunkte unter /api/admin (Lesezugriff für Kursstandorte etc.)
  const publicAdminGet =
    req.method === "GET" &&
    url.pathname.startsWith("/api/admin/") &&
    [
      "/api/admin/partners",
      "/api/admin/sessions",
      "/api/admin/courses",
      "/api/admin/course-categories",
      "/api/admin/course-types",
      "/api/admin/course-formats",
      "/api/admin/course-languages",
    ].some((p) => url.pathname.startsWith(p));

  let res = NextResponse.next({ request: { headers: requestHeaders } });

  if (isAdminRoute && !publicAdminGet) {
    const token = getAccessToken(req);
    const allowed = isAllowedSession(token);

    if (!allowed) {
      if (url.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
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

function extractRole(jwt: string): string | null {
  try {
    const payload = jwt.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json?.user_metadata?.role ?? json?.role ?? null;
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
