const FALLBACK_PROD = "https://musicmission.at";
const FALLBACK_DEV = "http://localhost:3000";

/**
 * Returns the public base URL used for canonicals, sitemap and robots.
 * Falls back to the live domain in production to avoid emitting localhost URLs.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const cleaned = fromEnv ? fromEnv.replace(/\/+$/, "") : "";
  if (cleaned) return cleaned;
  return process.env.NODE_ENV === "production" ? FALLBACK_PROD : FALLBACK_DEV;
}
