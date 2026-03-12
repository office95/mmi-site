"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import ConsultBanner from "@/components/ConsultBanner";
import { CountdownBadge } from "@/components/CountdownBadge";
import HeroSection from "@/components/HeroSection";

type SessionCard = {
  id: string;
  start_date?: string; // YYYY-MM-DD
  start_time?: string; // HH:MM:SS
  city?: string;
  address?: string;
  zip?: string;
  state?: string;
  seats_taken?: number | null;
  max_participants?: number | null;
  price_cents?: number;
  partner_id?: string | null;
  course?: { id: string; title: string; slug: string; hero_image_url?: string; type_id?: string | null; category_id?: string | null; created_at?: string | null };
  partners?: { name?: string; city?: string; state?: string; country?: string } | null;
  tags?: string[];
};

export default function EntdeckenClient({ h1, heroSubline }: { h1?: string; heroSubline?: string }) {
  const [sessions, setSessions] = useState<SessionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [qSearch, setQSearch] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFavPopover, setShowFavPopover] = useState(false);
  const [debugHost, setDebugHost] = useState("");
  const [debugRegion, setDebugRegion] = useState("");
  const [debugXRegion, setDebugXRegion] = useState("");
  const allowedStates = useMemo(
    () =>
      debugRegion === "DE"
        ? [
            "Baden-Württemberg",
            "Bayern",
            "Berlin",
            "Brandenburg",
            "Bremen",
            "Hamburg",
            "Hessen",
            "Mecklenburg-Vorpommern",
            "Niedersachsen",
            "Nordrhein-Westfalen",
            "Rheinland-Pfalz",
            "Saarland",
            "Sachsen",
            "Sachsen-Anhalt",
            "Schleswig-Holstein",
            "Thüringen",
          ]
        : ["Wien", "Niederösterreich", "Oberösterreich", "Steiermark", "Salzburg", "Tirol", "Vorarlberg", "Burgenland", "Kärnten"],
    [debugRegion]
  );

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/sessions", { cache: "no-store" });
        const json = await res.json();
        const data: SessionCard[] = json?.data ?? [];
        setSessions(
          data.map((raw): SessionCard => {
            const s = raw as SessionCard & {
              courses?: SessionCard["course"];
              course?: SessionCard["course"];
              partners?: SessionCard["partners"];
              partner?: SessionCard["partners"];
              tags?: unknown;
            };
            const tags =
              Array.isArray(s.tags)
                ? s.tags
                : typeof s.tags === "string"
                ? (() => {
                    try {
                      return JSON.parse(s.tags);
                    } catch {
                      return [];
                    }
                  })()
                : [];
            return {
              id: s.id,
              start_date: s.start_date,
              start_time: s.start_time,
              city: s.city ?? s.city,
              address: s.address ?? s.address,
              zip: s.zip ?? s.zip,
              state: s.state ?? s.state,
              seats_taken: (s as any).seats_taken ?? null,
              max_participants: (s as any).max_participants ?? null,
              price_cents: s.price_cents,
              partner_id: (s as any).partner_id ?? null,
              course: (s.courses ?? s.course ?? undefined) as any,
              partners: (s.partners ?? s.partner ?? undefined) as any,
              tags,
            };
          })
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, []);

  // Debug-Anzeige: Region + Host
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.host;
    const hostname = host.replace(/^www\./, "").split(":")[0];
    const region = hostname.endsWith(".de") ? "DE" : hostname.endsWith(".at") ? "AT" : "";
    setDebugHost(hostname);
    setDebugRegion(region || "unbekannt");
    setDebugXRegion((window as any).__REGION || "");
  }, []);

  // Stammdaten für Filter laden
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [tRes, cRes] = await Promise.all([
          fetch("/api/admin/course-types", { cache: "no-store" }),
          fetch("/api/admin/course-categories", { cache: "no-store" }),
        ]);
        const tJson = await tRes.json();
        const cJson = await cRes.json();
        setTypes(tJson?.data ?? []);
        setCategories(cJson?.data ?? []);
      } catch (e) {
        console.error(e);
      }
    };
    loadMeta();
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const futureSessions = useMemo(() => {
    const targetRegion = debugRegion === "DE" ? "DE" : "AT";
    const allowedCountries = targetRegion === "DE" ? ["deutschland", "germany"] : ["österreich", "austria"];
    return sessions.filter((s) => {
      // Region-Filter: nur Sessions mit passendem Land anzeigen
      const country = (s.partners?.country || "").toLowerCase();
      if (!allowedCountries.some((c) => country.includes(c))) return false;

      if (!s.start_date) return false;
      const d = new Date(s.start_date + "T00:00:00");
      // Am Starttag ausblenden -> nur strikt zukünftige Termine anzeigen
      return d > today;
    });
  }, [sessions, today, debugRegion]);

  // Favoriten aus localStorage laden
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("mmi_favorites");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setFavorites(new Set(arr.filter((x) => typeof x === "string")));
      }
    } catch (e) {
      console.error("Favoriten laden fehlgeschlagen", e);
    }
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("mmi_favorites", JSON.stringify(Array.from(next)));
        } catch (e) {
          console.error("Favoriten speichern fehlgeschlagen", e);
        }
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = qSearch.trim().toLowerCase();
    const stSel = filterState.trim().toLowerCase();
    const tSel = filterType;
    const cSel = filterCategory;

    const base = futureSessions.filter((s) => {
      if (q) {
        const hay = [
          s.course?.title,
          s.partners?.name,
          s.city,
          s.state,
          s.partners?.city,
          s.partners?.state,
          ...(s.tags ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (stSel && !((s.state || s.partners?.state || "").toLowerCase().includes(stSel))) return false;
      if (tSel && s.course?.type_id !== tSel) return false;
      if (cSel && s.course?.category_id !== cSel) return false;
      return true;
    });

    if (onlyFavs) {
      return base.filter((s) => favorites.has(s.id));
    }

    return base;
  }, [futureSessions, qSearch, filterState, filterType, filterCategory, favorites, onlyFavs]);

  const regionText = debugRegion === "DE" ? "Deutschland" : "Österreich";

  const sessionMap = useMemo(() => {
    const map = new Map<string, SessionCard>();
    futureSessions.forEach((s) => map.set(s.id, s));
    return map;
  }, [futureSessions]);

  const favoriteSessions = useMemo(() => {
    return Array.from(favorites)
      .map((id) => sessionMap.get(id))
      .filter(Boolean) as SessionCard[];
  }, [favorites, sessionMap]);

  const sessionBadges = (s: SessionCard) => {
    const badges: { name: string; color: string }[] = [];
    const typeName = types.find((t) => t.id === s.course?.type_id)?.name?.toLowerCase();
    const isNew = (() => {
      if (!s.course?.created_at) return false;
      const created = new Date(s.course.created_at);
      const now = new Date();
      const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 21;
    })();
    if (isNew) badges.push({ name: "Neu", color: "#ff1f8f" });
    if (typeName?.includes("intensiv")) badges.push({ name: "Intensiv", color: "#7c3aed" });
    if (typeName?.includes("extrem")) badges.push({ name: "Extrem", color: "#f97316" });
    return badges;
  };

  const locationText = (s: SessionCard) => {
    return (
      s.state ||
      s.partners?.state ||
      s.partners?.city ||
      s.city ||
      s.partners?.country ||
      s.address ||
      ""
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <h1 className="sr-only">{h1 ?? "Alle Kurstermine in Österreich"}</h1>
      <div className="relative">
        <HeroSection
          eyebrow="Entdecken"
          title={h1 ?? "Alle Kurstermine in Österreich"}
          subtitle={heroSubline ?? "Entdecke unser Angebot an innovativen Kursen."}
          image="https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/b4f50227-9cbd-44d9-8947-2afdf30e801d.webp"
          align="center"
          overlayStrength="strong"
          heightClass="h-[60vh] sm:h-[60vh] lg:h-[60vh] min-h-[35vh] -mt-[5.5rem] sm:-mt-[5.5rem]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent via-white/10 to-neutral-100" />
        <div className="pointer-events-auto absolute right-4 top-4 hidden sm:flex items-center gap-2">
          <div
            onMouseEnter={() => setShowFavPopover(true)}
            onMouseLeave={() => setShowFavPopover(false)}
            className="relative"
          >
            <button
              type="button"
              aria-label="Favoriten anzeigen"
              onClick={() => setShowFavPopover((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-pink-600 shadow-lg shadow-black/10 border border-white/80 hover:scale-105 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6">
                <path
                  d="M12.1 21.35 12 21.46l-.1-.11C6.14 15.95 2 12.19 2 8.5 2 5.42 4.42 3 7.5 3c1.9 0 3.63.9 4.5 2.09C12.87 3.9 14.6 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.69-4.14 7.45-9.9 12.85Z"
                  fill={favoriteSessions.length ? "#ff1f8f" : "none"}
                  stroke="#ff1f8f"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {showFavPopover && (
              <div className="absolute right-0 mt-2 w-72 max-w-[80vw] rounded-2xl border border-slate-200 bg-white shadow-xl shadow-black/10 p-3 text-left">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Favoriten ({favoriteSessions.length})</p>
                  <button
                    onClick={() => {
                      setOnlyFavs(true);
                      setShowFavPopover(false);
                    }}
                    className="text-[11px] font-semibold text-pink-600 underline underline-offset-2"
                  >
                    Nur Favoriten anzeigen
                  </button>
                </div>
                <div className="mt-2 space-y-2 max-h-64 overflow-auto pr-1">
                  {favoriteSessions.length === 0 && (
                    <p className="text-sm text-slate-600">Noch keine Favoriten. Klicke auf ein Herz bei einem Termin.</p>
                  )}
                  {favoriteSessions.slice(0, 6).map((fav) => (
                    <div key={fav.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{fav.course?.title || "Kurs"}</p>
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {(fav.start_date && new Date(fav.start_date + "T00:00:00").toLocaleDateString("de-AT")) || "Datum folgt"}
                        {fav.partners?.city || fav.state ? ` · ${fav.partners?.city || fav.state}` : ""}
                      </p>
                      <div className="mt-1 flex gap-2">
                        <Link
                          href={`/kurs/${fav.course?.slug || fav.course?.id || fav.id}?booking=${fav.id}${
                            fav.partner_id ? `&partner=${fav.partner_id}` : ""
                          }`}
                          className="text-[11px] font-semibold text-pink-600 underline underline-offset-2"
                        >
                          Öffnen
                        </Link>
                        <button
                          className="text-[11px] font-semibold text-slate-600 underline underline-offset-2"
                          onClick={() => toggleFavorite(fav.id)}
                        >
                          Entfernen
                        </button>
                      </div>
                    </div>
                  ))}
                  {favoriteSessions.length > 6 && (
                    <p className="text-xs text-slate-500">+ {favoriteSessions.length - 6} weitere</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="w-full bg-neutral-100 -mt-10 sm:-mt-12 pb-6">
        <div className="mx-auto max-w-6xl px-6 pb-12 sm:pb-14 space-y-6 pt-4 sm:pt-6">
          <div className="-mt-6 sm:-mt-8">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/60 px-4 py-5 sm:px-6 sm:py-7 -translate-y-4 sm:-translate-y-6">
              <div className="flex flex-col gap-4">
                <div className="space-y-3">
                  <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-3">
                    <div className="sm:hidden flex justify-end">
                      <button
                        onClick={() => setOnlyFavs((v) => !v)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                          onlyFavs ? "border-pink-500 bg-pink-50 text-black" : "border-slate-200 bg-white text-black"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                          <path
                            d="M12.1 21.35 12 21.46l-.1-.11C6.14 15.95 2 12.19 2 8.5 2 5.42 4.42 3 7.5 3c1.9 0 3.63.9 4.5 2.09C12.87 3.9 14.6 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.69-4.14 7.45-9.9 12.85Z"
                            fill={favoriteSessions.length ? "#ff1f8f" : "none"}
                            stroke="#ff1f8f"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Favoriten ({favoriteSessions.length})
                      </button>
                    </div>
                    <div className="sm:col-span-3">
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="h-9 w-9 flex items-center justify-center rounded-full bg-[#ff1f8f]/12 text-[#ff1f8f]">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                          </svg>
                        </div>
                        <input
                          value={qSearch}
                          onChange={(e) => setQSearch(e.target.value)}
                          placeholder="Kurs, Partner, Bundesland, Tag..."
                          className="w-full border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <select
                      value={filterState}
                      onChange={(e) => setFilterState(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm [appearance:none] pr-9"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ff1f8f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "calc(100% - 12px) center" }}
                    >
                      <option value="">Bundesland/Region</option>
                      {allowedStates.map((opt) => (
                        <option key={opt} value={opt.toLowerCase()}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm [appearance:none] pr-9"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ff1f8f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "calc(100% - 12px) center" }}
                    >
                      <option value="">Kurstyp</option>
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm [appearance:none] pr-9"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ff1f8f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "calc(100% - 12px) center" }}
                    >
                      <option value="">Kategorie</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setOnlyFavs((v) => !v)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                        onlyFavs ? "border-pink-500 bg-pink-50 text-black" : "border-slate-200 bg-white text-black"
                      }`}
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-pink-50 text-pink-600 border border-pink-200">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill={onlyFavs ? "#ff1f8f" : "none"} stroke="#ff1f8f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12.1 21.35 12 21.46l-.1-.11C6.14 15.95 2 12.19 2 8.5 2 5.42 4.42 3 7.5 3c1.9 0 3.63.9 4.5 2.09C12.87 3.9 14.6 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.69-4.14 7.45-9.9 12.85Z" />
                        </svg>
                      </span>
                      {onlyFavs ? "Nur Favoriten" : "Favoriten filtern"}
                      <span className="ml-1 rounded-full bg-slate-100 px-2 py-[2px] text-[11px] font-semibold text-slate-700">{favorites.size}</span>
                    </button>
                    <button
                      onClick={() => {
                        setQSearch("");
                        setFilterState("");
                        setFilterType("");
                        setFilterCategory("");
                      }}
                      className="text-sm text-pink-600 hover:text-pink-700 font-semibold"
                    >
                      Filter zurücksetzen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-500">Lade Termine…</p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-600">Keine Termine gefunden. Bitte Filter anpassen.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => {
                const courseSlug = s.course?.slug || s.course?.id || s.id;
                // Favorit pro Termin (Session), nicht kursübergreifend, damit unterschiedliche Standorte nicht gemeinsam getoggelt werden
                const favoriteId = s.id;
                const isFav = favoriteId ? favorites.has(favoriteId) : false;
                const bookingHref = `/buchen/${s.id}${
                  s.course?.slug ? `?kurs=${s.course.slug}` : s.course?.id ? `?courseId=${s.course.id}` : ""
                }`;
                const infoHref = courseSlug ? `/kurs/${courseSlug}${s.id ? `?booking=${s.id}` : ""}` : `/entdecken`;
                const coursePartnerHref =
                  courseSlug && s.partner_id ? `/kurs/${courseSlug}?partner=${s.partner_id}${s.id ? `&booking=${s.id}` : ""}` : infoHref;
                const doShare = async () => {
                  const primary = (typeof window !== "undefined" ? window.location.origin : "") + coursePartnerHref;
                  try {
                    await navigator.clipboard.writeText(primary);
                    setCopiedId(s.id);
                    setTimeout(() => setCopiedId(null), 1600);
                  } catch (_) {
                    // ignore
                  }
                };
                return (
                  <div
                    key={s.id}
                    className="group relative rounded-2xl border border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg transition overflow-hidden"
                  >
                    <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Teilen"
                        onClick={doShare}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-pink-600 shadow-sm shadow-black/10 border border-white/80 hover:scale-105 transition"
                      >
                        {copiedId === s.id ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="#16a34a">
                            <path d="M9.55 18.45 4.8 13.7l1.4-1.4 3.35 3.35 8.25-8.25 1.4 1.4-9.65 9.65Z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#ff1f8f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="2" />
                            <circle cx="6" cy="12" r="2" />
                            <circle cx="18" cy="19" r="2" />
                            <line x1="8" y1="11" x2="16" y2="6" />
                            <line x1="8" y1="13" x2="16" y2="18" />
                          </svg>
                        )}
                      </button>
                      {copiedId === s.id && (
                        <span className="absolute right-12 top-1.5 rounded-full bg-black/80 px-3 py-1 text-[11px] font-semibold text-white shadow">
                          Link in Zwischenablage kopiert
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label={isFav ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
                        onClick={() => favoriteId && toggleFavorite(favoriteId)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-pink-600 shadow-sm shadow-black/10 border border-white/80 hover:scale-105 transition"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                        >
                          <path
                            d="M12.1 21.35 12 21.46l-.1-.11C6.14 15.95 2 12.19 2 8.5 2 5.42 4.42 3 7.5 3c1.9 0 3.63.9 4.5 2.09C12.87 3.9 14.6 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.69-4.14 7.45-9.9 12.85Z"
                            fill={isFav ? "#ff1f8f" : "none"}
                            stroke="#ff1f8f"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <Link href={infoHref} className="relative block h-44 w-full bg-slate-100">
                      {s.course?.hero_image_url ? (
                        <Image
                          src={s.course.hero_image_url}
                          alt={s.course.title}
                          fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                        sizes="400px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400 text-sm">Kein Bild</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    {sessionBadges(s).length > 0 && (
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        {sessionBadges(s).map((b) => (
                          <span key={b.name} className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ backgroundColor: b.color }}>
                            {b.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="absolute left-3 bottom-3">
                      <CountdownBadge startDate={s.start_date} startTime={s.start_time} />
                    </div>
                  </Link>
                  <div className="p-4 space-y-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {s.start_date
                        ? `Start · ${new Date(s.start_date + "T00:00:00").toLocaleDateString("de-AT")}${
                            s.start_time?.slice(0, 5) ? ` · ${s.start_time.slice(0, 5)} Uhr` : ""
                          }`
                        : "Start · Termin folgt"}
                    </p>
                    <h2 className="font-anton text-xl leading-tight text-slate-900 line-clamp-2">{s.course?.title}</h2>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {s.partners?.name || s.city || "Partner folgt"}
                      {locationText(s) ? ` · ${locationText(s)}` : ""}
                    </p>
                    {s.price_cents ? (
                      <div className="pt-2 text-sm font-semibold text-pink-600">
                        {(s.price_cents / 100).toFixed(2)} €
                      </div>
                    ) : null}
                    {s.tags && s.tags.length ? (
                      <div className="flex flex-wrap gap-2 pt-2 text-[11px] text-slate-700">
                        {s.tags.slice(0, 3).map((t) => (
                          <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                            #{t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="pt-3 flex gap-2">
                      <Link
                        href={bookingHref}
                        className="flex-1 text-center rounded-full bg-pink-600 px-3 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5 transition"
                      >
                        Buchen
                      </Link>
                      <Link
                        href={infoHref}
                        className="flex-1 text-center rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:-translate-y-0.5 transition bg-white"
                      >
                        Mehr Infos
                      </Link>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <ConsultBanner />
    </div>
  );
}
