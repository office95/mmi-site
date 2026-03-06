"use client";

import { useEffect } from "react";

type Props = {
  renderedSlug: string;
};

// Stellt sicher, dass der angezeigte Kurs-Slug mit dem Pfad übereinstimmt.
// Wenn nicht, wird die URL mit ?slug=<pfadslug> neu geladen und der slug_fallback-Cookie aktualisiert.
export function SlugGuard({ renderedSlug }: Props) {
  useEffect(() => {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const match = path.match(/\/kurs\/([^/?#]+)/);
    const pathSlug = match?.[1] || "";

    if (!pathSlug) return;

    if (pathSlug !== renderedSlug) {
      try {
        document.cookie = `slug_fallback=${pathSlug}; path=/kurs; SameSite=Lax`;
      } catch {
        /* ignore */
      }
      const url = new URL(window.location.href);
      url.searchParams.set("slug", pathSlug);
      window.location.replace(url.toString());
    }
  }, [renderedSlug]);

  return null;
}
