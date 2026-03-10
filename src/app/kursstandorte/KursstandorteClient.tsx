"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import ConsultBanner from "@/components/ConsultBanner";
import HeroSection from "@/components/HeroSection";

type Partner = {
  id: string;
  name: string;
  slug: string | null;
  created_at?: string | null;
  state: string | null;
  country: string | null;
  tags: string[] | null;
  logo_path: string | null;
  hero1_path: string | null;
};

type Session = { partner_id: string | null; course_id: string | null };
type Course = {
  id: string;
  category_id: string | null;
  subcategory_id: string | null;
  type_id: string | null;
  format_id: string | null;
  language_id: string | null;
};

type Option = { value: string; label: string; parent?: string | null };

const toUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/${path.replace(/^\/+/m, "")}`;
};

export default function KursstandorteClient() {
  const [debugRegion, setDebugRegion] = useState("AT");
  const [debugHost, setDebugHost] = useState("");
  const [debugXRegion] = useState("(client)");

  const [partners, setPartners] = useState<Partner[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);
  const [formats, setFormats] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const regionLabel = debugRegion === "DE" ? "Deutschland" : "Österreich";
  const regionCountries = useMemo(
    () => (debugRegion === "DE" ? ["deutschland", "germany"] : ["österreich", "austria"]),
    [debugRegion]
  );
  const allowedStates = useMemo(
    () =>
      debugRegion === "DE"
        ? [
            "bayern",
            "berlin",
            "brandenburg",
            "bremen",
            "hamburg",
            "hessen",
            "mecklenburg-vorpommern",
            "niedersachsen",
            "nordrhein-westfalen",
            "rheinland-pfalz",
            "saarland",
            "sachsen",
            "sachsen-anhalt",
            "schleswig-holstein",
            "thüringen",
          ]
        : [
            "wien",
            "niederösterreich",
            "oberösterreich",
            "steiermark",
            "salzburg",
            "kärnten",
            "tirol",
            "vorarlberg",
            "burgenland",
          ],
    [debugRegion]
  );

  const resetFilters = () => {
    setSearch("");
    setFilterState("");
    setFilterCategory("");
    setFilterType("");
    setFilterFormat("");
  };

  useEffect(() => {
    const host = typeof window !== "undefined" ? window.location.host.toLowerCase() : "";
    const region = host.includes("musicmission.de") || host.endsWith(".de") ? "DE" : "AT";
    setDebugRegion(region);
    setDebugHost(host || "(leer)");
    const load = async () => {
      setLoading(true);
      try {
    const [pRes, sRes, cRes, catRes, tRes, fRes] = await Promise.all([
      fetch("/api/admin/partners"),
      fetch("/api/admin/sessions"),
      fetch("/api/admin/courses"),
      fetch("/api/admin/course-categories"),
      fetch("/api/admin/course-types"),
      fetch("/api/admin/course-formats"),
    ]);
    if (pRes.ok) setPartners((await pRes.json()).data ?? []);
    if (sRes.ok) setSessions((await sRes.json()).data ?? []);
    if (cRes.ok) setCourses((await cRes.json()).data ?? []);
    if (catRes.ok) setCategories(((await catRes.json()).data ?? []).map((c: any) => ({ value: c.id, label: c.name, parent: c.parent_id })));
    if (tRes.ok) setTypes(((await tRes.json()).data ?? []).map((t: any) => ({ value: t.id, label: t.name })));
    if (fRes.ok) setFormats(((await fRes.json()).data ?? []).map((f: any) => ({ value: f.id, label: f.name })));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const partnerCourseIds = useMemo(() => {
    const map = new Map<string, Set<string>>();
    sessions.forEach((s) => {
      if (s.partner_id && s.course_id) {
        if (!map.has(s.partner_id)) map.set(s.partner_id, new Set());
        map.get(s.partner_id)!.add(s.course_id);
      }
    });
    return map;
  }, [sessions]);

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      // nur Partner mit verfügbaren Kursen/Sessions
      const hasSessions = (partnerCourseIds.get(p.id) ?? new Set()).size > 0;
      if (!hasSessions) return false;
      // nach Domain filtern: bevorzugt Bundesland, sonst Land
      const stateLc = (p.state || "").toLowerCase();
      const countryLc = (p.country || "").toLowerCase();
      if (allowedStates.length && stateLc) {
        if (!allowedStates.some((st) => stateLc.includes(st))) return false;
      } else if (regionCountries.length && countryLc) {
        if (!regionCountries.some((c) => countryLc.includes(c))) return false;
      }

      const text = [p.name, p.state, p.country, ...(p.tags ?? [])].join(" ").toLowerCase();
      if (search && !text.includes(search.toLowerCase())) return false;
      if (filterState && (p.state ?? "").toLowerCase().indexOf(filterState.toLowerCase()) === -1) return false;
      if (filterCategory || filterType || filterFormat) {
        const courseIds = Array.from(partnerCourseIds.get(p.id) ?? []);
        const courseObjs = courses.filter((c) => courseIds.includes(c.id));
        if (filterCategory && !courseObjs.some((c) => c.category_id === filterCategory)) return false;
        if (filterType && !courseObjs.some((c) => c.type_id === filterType)) return false;
        if (filterFormat && !courseObjs.some((c) => c.format_id === filterFormat)) return false;
      }
      return true;
    });
  }, [partners, search, filterState, filterCategory, filterType, filterFormat, partnerCourseIds, courses, regionCountries]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <HeroSection
        eyebrow="Kursstandorte"
        title={`Unsere Kursstandorte in ${regionLabel}`}
        subtitle={`Finde Studios und Partner in ${regionLabel} für Musikproduktion, Tontechnik, Live-Sound, DJing und Vocalcoaching.`}
        image="https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/f5ca6ab3-c2a6-4fa2-8bea-474f1cbd445b.webp"
        overlayStrength="strong"
      >
        <div className="w-full max-w-xl">
          <p className="text-sm font-semibold text-white/90 text-left sm:text-center">Suche nach Standort, Partner oder Kurs</p>
          <div className="flex items-center gap-3 mt-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Bundesland, Partner, Kurs, Tag"
              className="flex-1 rounded-xl border border-white/50 bg-white/90 backdrop-blur px-3 py-2 text-sm text-slate-900 shadow-sm"
            />
          </div>
        </div>
      </HeroSection>

      <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14 space-y-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="min-w-[170px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            >
              <option value="">Bundesland/Region</option>
              {(debugRegion === "DE"
                ? [
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
                : [
                    "Wien",
                    "Niederösterreich",
                    "Oberösterreich",
                    "Steiermark",
                    "Salzburg",
                    "Kärnten",
                    "Tirol",
                    "Vorarlberg",
                    "Burgenland",
                  ]
              ).map((opt) => (
                <option key={opt} value={opt.toLowerCase()}>
                  {opt}
                </option>
              ))}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="min-w-[170px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm">
              <option value="">Kategorie</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="min-w-[170px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm">
              <option value="">Kurstyp</option>
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} className="min-w-[170px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm">
              <option value="">Format</option>
              {formats.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <button onClick={resetFilters} className="text-sm font-semibold text-pink-600 hover:text-pink-700">
              Filter zurücksetzen
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500">Lade Standorte…</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-600">Keine Standorte gefunden. Bitte Filter anpassen.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={p.slug ? `/partner/${p.slug}` : "#"}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg transition"
              >
                <div className="relative h-44 w-full bg-slate-100">
                  {p.hero1_path ? (
                    <Image src={toUrl(p.hero1_path) ?? p.hero1_path} alt={p.name} fill className="object-cover group-hover:scale-105 transition duration-300" sizes="400px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400 text-sm">Kein Bild</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                </div>
                {p.created_at && (() => { const diff = (Date.now() - new Date(p.created_at).getTime()) / (1000*60*60*24); return diff <= 21; })() && (
                  <span className="absolute right-3 top-3 rounded-full bg-[#ff1f8f] px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                    Neu
                  </span>
                )}
                <div className="p-4 space-y-2">
                  <h2 className="font-anton text-xl leading-tight text-slate-900 line-clamp-2">{p.name}</h2>
                  <p className="text-sm text-slate-600 line-clamp-2">{[p.state, p.country].filter(Boolean).join(" · ")}</p>
                  {p.tags && p.tags.length ? (
                    <div className="flex flex-wrap gap-2 pt-1 text-xs text-slate-700">
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <ConsultBanner />
    </div>
  );
}
