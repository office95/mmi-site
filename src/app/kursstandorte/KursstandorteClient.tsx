"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import ConsultBanner from "@/components/ConsultBanner";

type Partner = {
  id: string;
  name: string;
  slug: string | null;
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
  const [languages, setLanguages] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const regionLabel = debugRegion === "DE" ? "Deutschland" : "Österreich";

  const resetFilters = () => {
    setSearch("");
    setFilterCountry("");
    setFilterState("");
    setFilterCategory("");
    setFilterSubcategory("");
    setFilterType("");
    setFilterFormat("");
    setFilterLanguage("");
  };

  useEffect(() => {
    const host = typeof window !== "undefined" ? window.location.host.toLowerCase() : "";
    const region = host.includes("musicmission.de") || host.endsWith(".de") ? "DE" : "AT";
    setDebugRegion(region);
    setDebugHost(host || "(leer)");
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, sRes, cRes, catRes, tRes, fRes, lRes] = await Promise.all([
          fetch("/api/admin/partners"),
          fetch("/api/admin/sessions"),
          fetch("/api/admin/courses"),
          fetch("/api/admin/course-categories"),
          fetch("/api/admin/course-types"),
          fetch("/api/admin/course-formats"),
          fetch("/api/admin/course-languages"),
        ]);
        if (pRes.ok) setPartners((await pRes.json()).data ?? []);
        if (sRes.ok) setSessions((await sRes.json()).data ?? []);
        if (cRes.ok) setCourses((await cRes.json()).data ?? []);
        if (catRes.ok) setCategories(((await catRes.json()).data ?? []).map((c: any) => ({ value: c.id, label: c.name, parent: c.parent_id })));
        if (tRes.ok) setTypes(((await tRes.json()).data ?? []).map((t: any) => ({ value: t.id, label: t.name })));
        if (fRes.ok) setFormats(((await fRes.json()).data ?? []).map((f: any) => ({ value: f.id, label: f.name })));
        if (lRes.ok) setLanguages(((await lRes.json()).data ?? []).map((l: any) => ({ value: l.id, label: l.name })));
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
      const text = [p.name, p.state, p.country, ...(p.tags ?? [])].join(" ").toLowerCase();
      if (search && !text.includes(search.toLowerCase())) return false;
      if (filterCountry && (p.country ?? "") !== filterCountry) return false;
      if (filterState && (p.state ?? "").toLowerCase().indexOf(filterState.toLowerCase()) === -1) return false;
      if (filterCategory || filterSubcategory || filterType || filterFormat || filterLanguage) {
        const courseIds = Array.from(partnerCourseIds.get(p.id) ?? []);
        const courseObjs = courses.filter((c) => courseIds.includes(c.id));
        if (filterCategory && !courseObjs.some((c) => c.category_id === filterCategory)) return false;
        if (filterSubcategory && !courseObjs.some((c) => c.subcategory_id === filterSubcategory)) return false;
        if (filterType && !courseObjs.some((c) => c.type_id === filterType)) return false;
        if (filterFormat && !courseObjs.some((c) => c.format_id === filterFormat)) return false;
        if (filterLanguage && !courseObjs.some((c) => c.language_id === filterLanguage)) return false;
      }
      return true;
    });
  }, [partners, search, filterCountry, filterState, filterCategory, filterSubcategory, filterType, filterFormat, filterLanguage, partnerCourseIds, courses]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <section className="relative h-[50vh] w-full overflow-hidden bg-black text-white">
        <Image
          src="https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/dc09c738-147b-44ad-8f10-0a7b19c2cc8a.webp"
          alt="Kursstandorte"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/40 to-black/15" />
        <div className="absolute bottom-10 left-6 sm:left-12 text-left space-y-2">
          <p className="text-sm uppercase tracking-[0.22em] text-white/70">Kursstandorte</p>
          <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl text-white leading-tight drop-shadow-lg">
            Musik-Standorte & Studios in {regionLabel}
          </h1>
          <p className="text-white/85 text-base max-w-2xl">
            Finde Studios und Partner in {regionLabel} für Musikproduktion, Tontechnik, Live-Sound, DJing und Vocalcoaching.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14 space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ort, Partner oder Tag suchen…"
              className="w-full sm:max-w-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            />
            <button onClick={resetFilters} className="text-sm font-semibold text-pink-600 hover:text-pink-700">
              Filter zurücksetzen
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm">
              <option value="">Land</option>
              <option value="Österreich">Österreich</option>
              <option value="Deutschland">Deutschland</option>
            </select>
            <input
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              placeholder="Bundesland/Region"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm">
              <option value="">Kategorie</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select value={filterSubcategory} onChange={(e) => setFilterSubcategory(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm">
              <option value="">Subkategorie</option>
              {categories
                .filter((c) => c.parent)
                .map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm">
              <option value="">Kurstyp</option>
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm">
              <option value="">Format</option>
              {formats.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm">
              <option value="">Sprache</option>
              {languages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
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
