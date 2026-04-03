type CookieEntry = { name: string; value: string };

function parseCookieHeader(cookieHeader: string | null): CookieEntry[] {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const idx = part.indexOf("=");
      if (idx < 0) return { name: part, value: "" };
      return { name: part.slice(0, idx), value: part.slice(idx + 1) };
    });
}

function parseJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function extractAccessTokenFromCookieValue(raw: string): string | null {
  if (!raw) return null;
  if (raw.split(".").length === 3) return raw;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string" && parsed.split(".").length === 3) return parsed;
    if (Array.isArray(parsed)) {
      const token = parsed.find((part) => typeof part === "string" && part.split(".").length === 3);
      return typeof token === "string" ? token : null;
    }
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const token =
        (record["access_token"] as string | undefined) ||
        (record["accessToken"] as string | undefined) ||
        (record["token"] as string | undefined);
      return token ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

function getAccessTokenFromRequest(req: Request): string | null {
  const cookies = parseCookieHeader(req.headers.get("cookie"));
  const authCookies = cookies.filter(
    (c) =>
      c.name === "sb-access-token" ||
      c.name.startsWith("sb-") ||
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

export function getUserEmailFromRequest(req: Request): string | null {
  const token = getAccessTokenFromRequest(req);
  if (!token) return null;
  const payload = parseJwtPayload(token);
  const email = payload?.["email"];
  return typeof email === "string" ? email.trim().toLowerCase() : null;
}

