"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import ConsultBanner from "@/components/ConsultBanner";

type SessionCard = {
  id: string;
  start_date?: string; // YYYY-MM-DD
  start_time?: string; // HH:MM:SS
  city?: string;
  address?: string;
  zip?: string;
  state?: string;
  price_cents?: number;
  course?: { id: string; title: string; slug: string; hero_image_url?: string; type_id?: string | null; category_id?: string | null };
  partners?: { name?: string; city?: string; state?: string } | null;
  tags?: string[];
};

export default function EntdeckenPage() {
  const [sessions, setSessions] = useState<SessionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [qSearch, setQSearch] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [debugHost, setDebugHost] = useState("");
  const [debugRegion, setDebugRegion] = useState("");
  const [debugXRegion, setDebugXRegion] = useState("");

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
              Array.isArray(s.tags) ? s.tags : typeof s.tags === "string"
                ? (() => { try { return JSON.parse(s.tags); } catch { return []; } })()
                : [];
            return {
              id: s.id,
              start_date: s.start_date,
              start_time: s.start_time,
              city: s.city ?? s.city,
              address: s.address ?? s.address,
              zip: s.zip ?? s.zip,
              state: s.state ?? s.state,
              price_cents: s.price_cents,
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
    return sessions.filter((s) => {
      if (!s.start_date) return false;
      const d = new Date(s.start_date + "T00:00:00");
      return d >= today;
    });
  }, [sessions, today]);

  const filtered = useMemo(() => {
    const q = qSearch.trim().toLowerCase();
    const stSel = filterState.trim().toLowerCase();
    const tSel = filterType;
    const cSel = filterCategory;

    return futureSessions.filter((s) => {
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
  }, [futureSessions, qSearch, filterState, filterType, filterCategory]);

  const regionText = debugRegion === "DE" ? "Deutschland" : "Österreich";

  const sessionBadges = (s: SessionCard) => {
    const badges: { name: string; color: string }[] = [];
    const typeName = types.find((t) => t.id === s.course?.type_id)?.name?.toLowerCase();
    if (typeName?.includes("intensiv")) badges.push({ name: "Intensiv", color: "#7c3aed" });
    if (typeName?.includes("extrem")) badges.push({ name: "Extrem", color: "#be123c" });
    return badges;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <section className="relative h-[40vh] sm:h-[50vh] lg:h-[60vh] w-full overflow-hidden text-white">
        <Image
          src="https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/b4f50227-9cbd-44d9-8947-2afdf30e801d.webp"
          alt="Entdecken"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#ff1f8f]/35 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center px-6 pb-6">
          <div className="text-center text-white space-y-3 max-w-4xl">
            <p className="text-sm uppercase tracking-[0.2em] text-white/70">Entdecken</p>
            <h1 className="font-anton text-4xl sm:text-5xl leading-tight drop-shadow-[0_8px_30px_rgba(0,0,0,0.35)]">Alle Kurstermine. Auf einen Blick.</h1>
            <p className="text-white/90 text-base sm:text-lg leading-relaxed">
              Finde deinen nächsten Termin – filtere nach Kurs, Partner oder Standort.
            </p>
            <div className="w-full max-w-xl mx-auto">
              <input
                value={qSearch}
                onChange={(e) => setQSearch(e.target.value)}
                placeholder="Kurs, Partner, Ort suchen…"
                className="w-full rounded-2xl border border-white/30 bg-white/90 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-neutral-100">
        <div className="mx-auto max-w-6xl px-6 pb-16 space-y-6 pt-6 sm:pt-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-3">
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-pink-500 focus:outline-none"
                >
                  <option value="">Bundesland (alle)</option>
                  {Array.from(
                    new Set(
                      sessions
                        .map((s) => s.state || s.partners?.state || "")
                        .filter((v) => v && v.trim() !== "")
                    )
                  ).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-pink-500 focus:outline-none"
                >
                  <option value="">Kurstyp (alle)</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-pink-500 focus:outline-none"
                >
                  <option value="">Kategorie (alle)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  setFilterState("");
                  setFilterType("");
                  setFilterCategory("");
                  setQSearch("");
                }}
                className="inline-flex items-center rounded-full border border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition"
              >
                Filter zurücksetzen
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Debug Region: {debugRegion || "—"} · host: {debugHost || "—"} · x-region: {debugXRegion || "(client)"}
            </p>

            <div className="flex items-center justify-between mt-6 sm:mt-8">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Kurstermine</p>
                <h2 className="font-anton text-3xl text-slate-900">Bevorstehende Termine</h2>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">Lade Termine…</div>
          ) : (
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    {s.course?.hero_image_url ? (
                      <Image
                        src={s.course.hero_image_url}
                        alt={s.course.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition duration-300 group-hover:scale-105"
                        priority={false}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400 text-sm">Kein Bild</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    {sessionBadges(s).length > 0 && (
                      <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                        {sessionBadges(s).slice(0, 3).map((b, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow"
                            style={{ backgroundColor: b.color }}
                          >
                            {b.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-pink-600">
                      {formatDate(s.start_date)} • {formatTime(s.start_time)}
                    </p>
                    <h3 className="font-anton text-xl leading-tight text-slate-900">{s.course?.title ?? "Kurs"}</h3>
                    <p className="text-sm font-semibold text-slate-800">
                      {s.partners?.name ? s.partners.name : "Partner folgt"}
                    </p>
                    <p className="text-sm text-slate-600">{locationLine(s)}</p>
                    <p className="text-base font-semibold text-slate-900">{formatPrice(s.price_cents)}</p>
                    {s.tags && s.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {s.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                    {s.course?.slug && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Link
                          href={`/buchen/${s.id}?course=${s.course?.slug ?? ""}&courseId=${s.course?.id ?? ""}`}
                          className="inline-flex rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 focus:text-white focus-visible:text-white active:text-white transition"
                          aria-label={`Kurs ${s.course?.title ?? ""} buchen`}
                        >
                          Buchen
                        </Link>
                        <Link
                          href={`/kurs/${s.course.slug}`}
                          className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition"
                          aria-label={`Mehr Infos zu ${s.course.title ?? ""}`}
                        >
                          Mehr Infos
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {futureSessions.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                  Keine Termine gefunden.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Beratung CTA vor Footer */}
      <div className="mt-0">
        <ConsultBanner height="70vh" />
      </div>
    </div>
  );
}

const formatDate = (d?: string) => (d ? new Date(d + "T00:00:00").toLocaleDateString("de-AT") : "Datum folgt");
const formatTime = (t?: string) => (t ? t.slice(0, 5) : "Zeit folgt");
const formatPrice = (cents?: number) => (typeof cents === "number" ? `${(cents / 100).toFixed(2)} €` : "Preis folgt");

const locationLine = (s: SessionCard) => {
  const city = s.city || s.partners?.city;
  const state = s.state || s.partners?.state;
  const parts = [city, state].filter((p) => p !== undefined && p !== null && p !== "");
  return parts.length ? parts.join(", ") : "Ort folgt";
};
