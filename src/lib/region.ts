import { headers } from "next/headers";

// Muss async sein, weil headers() ein Promise liefert
export async function getRegion(): Promise<"AT" | "DE"> {
  try {
    const h = await headers();
    const getHeader = (key: string) => {
      const anyH: any = h as any;
      if (typeof anyH.get === "function") return anyH.get(key) as string | undefined;
      if (anyH && typeof anyH[key] === "function") return anyH[key](key) as string | undefined;
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
