import { NextResponse } from "next/server";

// Accept both legacy ZB_* and current ZOHO_* env names to avoid misconfig between env files and servers.
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID || process.env.ZB_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || process.env.ZB_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || process.env.ZB_REFRESH_TOKEN;
const ZOHO_ORG_ID_VALUE = process.env.ZOHO_ORG_ID || process.env.ZB_ORG_ID;
const ZOHO_DC = process.env.ZOHO_DC || process.env.ZB_DC || "eu"; // eu, com, in, au, jp, sa, ca

if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN || !ZOHO_ORG_ID_VALUE) {
  console.warn("Zoho Books env vars missing: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ORG_ID (legacy ZB_* also accepted)");
}

const accountsHost = `https://accounts.zoho.${ZOHO_DC}`;
const apiHost = `https://www.zohoapis.${ZOHO_DC}`;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function fetchAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) return cachedToken.token;
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) throw new Error("Zoho Books credentials not configured");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    refresh_token: ZOHO_REFRESH_TOKEN,
  });

  const res = await fetch(`${accountsHost}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoho token refresh failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: json.access_token,
    expiresAt: now + (json.expires_in || 3600) * 1000,
  };
  return cachedToken.token;
}

export async function zohoRequest<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await fetchAccessToken();
  const url = path.startsWith("http") ? path : `${apiHost}/books/v3${path}`;
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Zoho-oauthtoken ${token}`);
  headers.set("Accept", "application/json");
  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoho API ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export function requireZohoConfigured() {
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN || !ZOHO_ORG_ID_VALUE) {
    return NextResponse.json({ error: "Zoho Books not configured" }, { status: 500 });
  }
  return null;
}

export const ZOHO_ORG_ID = ZOHO_ORG_ID_VALUE;
export const ZOHO_API_HOST = apiHost;
