import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

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
    // Supabase Session prüfen (Edge-kompatibel)
    const supabase = createServerClient(
      { supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      { request: req, response: res }
    );
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const email = session?.user?.email?.toLowerCase();
    const allowed = email && ADMIN_EMAILS.includes(email);

    if (!allowed) {
      const redirectTo = `/login?redirect=${encodeURIComponent(url.pathname)}`;
      res = NextResponse.redirect(new URL(redirectTo, req.url));
      res.cookies.set("region", region, { path: "/" });
      return res;
    }
  }

  res.headers.set("x-region", region);
  res.cookies.set("region", region, { path: "/" });
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/partner-blog/create", "/:path*"],
};
