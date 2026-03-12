"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
          fetch("/api/admin/partners?all=1"),
          fetch("/api/admin/sessions"),
          fetch("/api/admin/courses"),
          fetch("/api/admin/course-categories"),
          fetch("/api/admin/course-types"),
          fetch("/api/admin/course-formats"),
        ]);
        if (pRes.ok) setPartners((await pRes.json()).data ?? []);
        if (sRes.ok) setSessions((await sRes.json()).data ?? []);
        if (cRes.ok) setCourses((await cRes.json()).data ?? []);
        if (catRes.ok)
          setCategories(((await catRes.json()).data ?? []).map((c: any) => ({ value: c.id, label: c.name, parent: c.parent_id })));
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
      const hasSessions = (partnerCourseIds.get(p.id) ?? new Set()).size > 0;
      if (!hasSessions) return false;

      const stateLc = (p.state || "").toLowerCase();
      const countryLc = (p.country || "").toLowerCase();
      const partnerRegion = countryLc.includes("deutschland") || countryLc.includes("germany") ? "DE" : countryLc ? "AT" : debugRegion;
      const allowedStatesCandidate =
        partnerRegion === "DE"
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
            ];
      const allowedCountriesCandidate = partnerRegion === "DE" ? ["deutschland", "germany"] : ["österreich", "austria"];

      const stateMatch = allowedStatesCandidate.some((st) => stateLc.includes(st));
      const countryMatch = allowedCountriesCandidate.some((c) => countryLc.includes(c));
      if (stateLc || countryLc) {
        if (!(stateMatch || countryMatch)) return false;
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

      <div className="relative">
        <HeroSection
          eyebrow="Kursstandorte"
          title={`Unsere Kursstandorte in ${regionLabel}`}
          subtitle={`Finde Studios und Partner in ${regionLabel} für Musikproduktion, Tontechnik, Live-Sound, DJing und Vocalcoaching.`}
          image="https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/f5ca6ab3-c2a6-4fa2-8bea-474f1cbd445b.webp"
          overlayStrength="strong"
          heightClass="h-[60vh] sm:h-[60vh] lg:h-[60vh] min-h-[55vh] -mt-[5.5rem] sm:-mt-[5.5rem]"
          align="center"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent via-black/10 to-[#f4f5f7]" />
      </div>

      <section className="w-full bg-[#f4f5f7] -mt-10 sm:-mt-12 pb-6">
        <div className="mx-auto max-w-6xl px-6 pb-12 sm:pb-14 space-y-6 pt-4 sm:pt-6">
          <div className="-mt-6 sm:-mt-8">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/60 px-4 py-5 sm:px-6 sm:py-7 -translate-y-4 sm:-translate-y-6">
              <div className="grid w-full max-w-5xl gap-3 sm:grid-cols-3 mx-auto">
                <div className="sm:col-span-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="h-9 w-9 flex items-center justify-center rounded-full bg-[#ff1f8f]/12 text-[#ff1f8f]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                      </svg>
                    </div>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Bundesland, Partner, Kurs, Tag"
                      className="w-full border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="min-w-[170px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm [appearance:none] pr-9"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ff1f8f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "calc(100% - 12px) center" }}
                >
                  <option value="">Bundesland/Region</option>
                  {(debugRegion === "DE"
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
                    : [
                        "Burgenland",
                        "Kärnten",
                        "Niederösterreich",
                        "Oberösterreich",
                        "Salzburg",
                        "Steiermark",
                        "Tirol",
                        "Vorarlberg",
                        "Wien",
                      ]
                  ).map((opt) => (
                    <option key={opt} value={opt.toLowerCase()}>
                      {opt}
                    </option>
                  ))}
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="min-w-[170px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm [appearance:none] pr-9"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ff1f8f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "calc(100% - 12px) center" }}
                >
                  <option value="">Kategorie</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="min-w-[170px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm [appearance:none] pr-9"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ff1f8f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "calc(100% - 12px) center" }}
                >
                  <option value="">Kurstyp</option>
                  {types.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterFormat}
                  onChange={(e) => setFilterFormat(e.target.value)}
                  className="min-w-[170px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm [appearance:none] pr-9"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ff1f8f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "calc(100% - 12px) center" }}
                >
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
        </div>
      </section>

      <ConsultBanner />
    </div>
  );
}
