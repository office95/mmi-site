"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Client-Fallback: rekonstruiert den Slug aus window.location.pathname und setzt ihn als Query-Param + Cookie.
export function SlugSelfHeal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const existing = searchParams?.get("slug");
    if (existing) return;

    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const match = path.match(/\/kurs\/([^/?#]+)/);
    const slug = match?.[1];
    if (!slug) return;

    // Cookie setzen, damit der Server beim nächsten Request einen Fallback hat
    try {
      document.cookie = `slug_fallback=${slug}; path=/kurs; SameSite=Lax`;
    } catch {
      /* ignore */
    }

    // Query-Param anhängen und per replace neu laden, damit searchParams auf Server-Seite greift
    const url = new URL(window.location.href);
    url.searchParams.set("slug", slug);
    router.replace(url.pathname + "?" + url.searchParams.toString());
  }, [router, searchParams]);

  return null;
}
