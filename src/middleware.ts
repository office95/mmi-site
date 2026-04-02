import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
const FALLBACK_ADMINS = ["office@musicmission.at"];
const ADMIN_EMAILS = [
  ...(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  ...FALLBACK_ADMINS,
];

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
  const isAdminRoute = url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin");
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

  const res = NextResponse.next({ request: { headers: requestHeaders } });

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

  const needsAdminGuard = isAdminRoute && !publicAdminGet && !publicAdminService;
  if (needsAdminGuard) {
    const accessToken = getAccessToken(req);
    const evaluation = await evaluateSession(accessToken);
    if (!evaluation.allowed) {
      if (url.searchParams.get("debug") === "1") {
        const payload = {
          reason: evaluation.reason ?? "unauthorized",
          path: url.pathname,
          tokenPresent: Boolean(accessToken),
        };
        return NextResponse.json(payload, { status: 403 });
      }
      return redirectToLogin(req, url, region);
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

function parseJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    let decoded = "";
    if (typeof globalThis.atob === "function") {
      decoded = globalThis.atob(padded);
    } else if (typeof Buffer !== "undefined") {
      decoded = Buffer.from(padded, "base64").toString("utf8");
    } else {
      const binaryString = Array.from(padded)
        .map((char) => char.charCodeAt(0))
        .map((code) => String.fromCharCode(code))
        .join("");
      decoded = binaryString;
    }
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function extractEmail(jwt: string): string | null {
  const payload = parseJwtPayload(jwt);
  if (!payload) return null;
  return (payload?.["email"] as string | undefined)?.toLowerCase() ?? null;
}

function getAccessToken(req: NextRequest): string | null {
  const authCookies = req.cookies.getAll().filter(
    (c) =>
      c.name === "sb-access-token" || // custom cookie from login page
      c.name.startsWith("sb-") || // Supabase project cookies
      c.name.endsWith("auth-token") ||
      c.name.includes("auth-token")
  );

  for (const cookie of authCookies) {
    const raw = decodeURIComponent(cookie.value);
    const token = extractAccessTokenFromCookieValue(raw);
    if (token) return token;
  }

  return null;
}

function extractAccessTokenFromCookieValue(raw: string): string | null {
  if (!raw) return null;

  // Raw JWT in cookie value.
  if (raw.split(".").length === 3) return raw;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string" && parsed.split(".").length === 3) return parsed;
    if (Array.isArray(parsed)) {
      const candidate = parsed.find((part) => typeof part === "string" && part.split(".").length === 3);
      return typeof candidate === "string" ? candidate : null;
    }
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const direct =
        (record["access_token"] as string | undefined) ||
        (record["accessToken"] as string | undefined) ||
        (record["token"] as string | undefined);
      if (direct) return direct;
    }
  } catch {
    return null;
  }

  return null;
}

function redirectToLogin(req: NextRequest, url: URL, region: string, extraQuery?: string) {
  const redirectTo = `/login?redirect=${encodeURIComponent(url.pathname)}${extraQuery ? `&${extraQuery}` : ""}`;
  const redirect = NextResponse.redirect(new URL(redirectTo, req.url));
  redirect.cookies.set("region", region, { path: "/" });
  return redirect;
}

async function evaluateSession(token: string | null): Promise<{ allowed: boolean; reason?: "unauthorized" }> {
  if (!token) return { allowed: false };
  const email = extractEmail(token);
  if (!email) return { allowed: false, reason: "unauthorized" };
  const normalized = email.trim().toLowerCase();
  const allowed = ADMIN_EMAILS.includes(normalized);
  if (!allowed) return { allowed: false, reason: "unauthorized" };
  return { allowed: true };
}
