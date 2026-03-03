import { headers } from "next/headers";

export function getRegion(): "AT" | "DE" {
  try {
    const h = headers();
    const getHeader = (key: string) => {
      // Headers in Next normally expose .get; be defensive for dev/hot-reload
      const anyH: any = h as any;
      if (typeof anyH.get === "function") return anyH.get(key);
      if (anyH && typeof anyH[key] === "function") return anyH[key](key);
      return undefined;
    };

    const headerRegion = getHeader("x-region")?.toUpperCase();
    if (headerRegion === "AT" || headerRegion === "DE") return headerRegion;

    const host = getHeader("host")?.toLowerCase() || getHeader("x-forwarded-host")?.toLowerCase();
    if (host?.endsWith(".de")) return "DE";
    if (host?.endsWith(".at")) return "AT";

    const cookie = getHeader("cookie") || "";
    const match = typeof cookie === "string" ? cookie.match(/region=(AT|DE)/) : null;
    if (match) return match[1] as "AT" | "DE";
  } catch {
    // ignore and use fallback
  }
  return "AT";
}
