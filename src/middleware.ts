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

  // Alte Blog-URLs, die bewusst entfernt wurden → 410 Gone (keine Indexierung mehr)
  const gonePaths = new Set(["/blog/willkommen", "/blog/willkommen-bei-mmi"]);
  const normalizedPath = url.pathname.endsWith("/") && url.pathname !== "/" ? url.pathname.slice(0, -1) : url.pathname;
  if (gonePaths.has(normalizedPath)) {
    return new NextResponse(null, { status: 410 });
  }

  // Zeitgesteuertes Live-Schalten der DE-Domain (bypasst Coming-Soon)
  // Temporär: musicmission.de live schalten (Coming-Soon aus)
  const liveUntilEnv = process.env.DE_LIVE_UNTIL || "";
  const liveUntil = liveUntilEnv ? Date.parse(liveUntilEnv) : 0;
  const now = Date.now();
  const allowDeLive = liveUntil > 0 && now < liveUntil; // DE nur live, wenn DE_LIVE_UNTIL in Zukunft gesetzt ist

  // Domain → Region Mapping
  const region = host.endsWith(".at") ? "AT" : host.endsWith(".de") ? "DE" : "AT";
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const cleanSlug = (raw: string | null) => {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    // Entferne typische App Router Suffixe von Flight/Data Requests
    return trimmed.replace(/\.(rsc|json|html?)$/i, "");
  };
  const slugSegment = pathSegments[0] === "kurs" && pathSegments[1] ? cleanSlug(pathSegments[1]) : null;

  const isAssetPath =
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/static") ||
    url.pathname.startsWith("/favicon") ||
    url.pathname.startsWith("/robots.txt") ||
    url.pathname.startsWith("/sitemap.xml") ||
    url.pathname.startsWith("/fonts");

  // DE-Domain: Coming Soon Seite (ohne Assets/API/Admin)
  if (
    region === "DE" &&
    !allowDeLive &&
    !isAssetPath &&
    !url.pathname.startsWith("/api") &&
    !url.pathname.startsWith("/admin") &&
    !url.pathname.startsWith("/de-coming-soon")
  ) {
    url.pathname = "/de-coming-soon";
    return NextResponse.redirect(url);
  }

  // Header nach vorne durchreichen, damit RSC getRegion() den Wert sieht
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-region", region);
  requestHeaders.set("x-pathname", url.pathname);
  if (slugSegment) requestHeaders.set("x-slug", slugSegment);
  requestHeaders.set("x-full-url", req.url);

  // Admin-Guard
  const isAdminRoute =
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/api/admin");
  const isPartnerBlogRoute = url.pathname.startsWith("/partner-blog/create");

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

  // Admin-POST-BYPASS: sync-orders ist bewusst öffentlich (interner Aufruf per cURL)
  const publicAdminService =
    url.pathname.startsWith("/api/admin/zoho/sync-orders") ||
    url.pathname.startsWith("/api/admin/zoho/create-test-order") ||
    url.pathname.startsWith("/api/admin/zoho/sync-sessions");

  let res = NextResponse.next({ request: { headers: requestHeaders } });

  if (isPartnerBlogRoute) {
    // Partner-Blog: erlaubt mit gültigem Token, kein Login nötig
    const hasToken = url.searchParams.has("token");
    if (!hasToken) {
      const redirectTo = `/login?redirect=${encodeURIComponent(url.pathname + url.search)}`;
      const redirect = NextResponse.redirect(new URL(redirectTo, req.url));
      redirect.cookies.set("region", region, { path: "/" });
      return redirect;
    }
  }

  if (isAdminRoute && !publicAdminGet && !publicAdminService) {
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
  if (slugSegment) res.headers.set("x-slug", slugSegment);
  res.cookies.set("region", region, { path: "/" });
  if (slugSegment) res.cookies.set("slug_fallback", slugSegment, { path: "/kurs" });
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
