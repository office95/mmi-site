export function getRegionFromCookie(): "AT" | "DE" {
  if (typeof document === "undefined") return "AT";
  const match = document.cookie.match(/region=(AT|DE)/);
  if (match) return match[1] as "AT" | "DE";
  return "AT";
}
