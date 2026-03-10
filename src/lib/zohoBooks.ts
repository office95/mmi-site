import { NextResponse } from "next/server";

const ZB_CLIENT_ID = process.env.ZB_CLIENT_ID;
const ZB_CLIENT_SECRET = process.env.ZB_CLIENT_SECRET;
const ZB_REFRESH_TOKEN = process.env.ZB_REFRESH_TOKEN;
const ZB_ORG_ID = process.env.ZB_ORG_ID;
const ZB_DC = process.env.ZB_DC || "eu"; // eu, com, in, au, jp, sa, ca

if (!ZB_CLIENT_ID || !ZB_CLIENT_SECRET || !ZB_REFRESH_TOKEN || !ZB_ORG_ID) {
  console.warn("Zoho Books env vars missing: ZB_CLIENT_ID, ZB_CLIENT_SECRET, ZB_REFRESH_TOKEN, ZB_ORG_ID");
}

const accountsHost = `https://accounts.zoho.${ZB_DC}`;
const apiHost = `https://www.zohoapis.${ZB_DC}`;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function fetchAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) return cachedToken.token;
  if (!ZB_CLIENT_ID || !ZB_CLIENT_SECRET || !ZB_REFRESH_TOKEN) throw new Error("Zoho Books credentials not configured");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: ZB_CLIENT_ID,
    client_secret: ZB_CLIENT_SECRET,
    refresh_token: ZB_REFRESH_TOKEN,
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
  if (!ZB_CLIENT_ID || !ZB_CLIENT_SECRET || !ZB_REFRESH_TOKEN || !ZB_ORG_ID) {
    return NextResponse.json({ error: "Zoho Books not configured" }, { status: 500 });
  }
  return null;
}

export const ZOHO_ORG_ID = ZB_ORG_ID;
export const ZOHO_API_HOST = apiHost;
