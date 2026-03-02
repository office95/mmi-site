import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const redirect = url.searchParams.get("redirect") ?? "/admin";
  const code = url.searchParams.get("code");

  const res = NextResponse.redirect(new URL(redirect, req.url));

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (cookies) =>
            cookies.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            ),
        },
      }
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  return res;
}
