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
  return `${base}/storage/v1/object/public/${path.replace(/^\/+/, "")}`;
};

export default function KursstandortePage() {
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
      if (filterState && (p.state ?? "") !== filterState) return false;

      const courseIds = partnerCourseIds.get(p.id);
      if (filterCategory || filterSubcategory || filterType || filterFormat || filterLanguage) {
        if (!courseIds) return false;
        const hasMatch = courses.some((c) => {
          if (!courseIds.has(c.id)) return false;
          if (filterCategory && c.category_id !== filterCategory) return false;
          if (filterSubcategory && c.subcategory_id !== filterSubcategory) return false;
          if (filterType && c.type_id !== filterType) return false;
          if (filterFormat && c.format_id !== filterFormat) return false;
          if (filterLanguage && c.language_id !== filterLanguage) return false;
          return true;
        });
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [partners, search, filterCountry, filterState, filterCategory, filterSubcategory, filterType, filterFormat, filterLanguage, courses, partnerCourseIds]);

  const heroImage =
    "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/b4f50227-9cbd-44d9-8947-2afdf30e801d.webp";

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <section className="relative h-[40vh] md:h-[32vh] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage} alt="Kursstandorte" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#ff1f8f]/35 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="text-center text-white space-y-3 max-w-4xl">
            <h1 className="font-anton text-4xl sm:text-5xl leading-tight drop-shadow-[0_8px_30px_rgba(0,0,0,0.35)]">Kursstandorte</h1>
            <p className="text-white/90 text-base sm:text-lg leading-relaxed">
              Alle Standorte. Auf einen Blick. Filtere nach Region oder Kursformat – und finde den Ort, der zu dir passt.
            </p>
            <div className="w-full max-w-xl mx-auto">
              <Input label="" placeholder="Standort, Partner, Ort suchen…" value={search} onChange={setSearch} center />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 pt-[2vh] sm:px-10 lg:px-20 space-y-8 bg-neutral-100">
        <div className="mx-auto max-w-[1200px] space-y-5">
          <p className="text-xs text-slate-500 text-center">
            Debug Region: {debugRegion} · host: {debugHost} · x-region: {debugXRegion}
          </p>

          {/* Mobile Accordion for Filters */}
          <div className="sm:hidden">
            <details className="rounded-3xl border border-slate-200 bg-white/95 shadow-sm shadow-slate-200/60">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900">
                <span>Filter anzeigen</span>
                <span className="text-xs text-slate-500">Tippen zum Aufklappen</span>
              </summary>
              <div className="px-4 pb-4 space-y-3">
                <div className="grid w-full gap-3">
                  <Select label="Land" value={filterCountry} onChange={setFilterCountry} options={uniqOptions(partners.map((p) => p.country))} placeholder="Alle Länder" />
                  <Select label="Bundesland" value={filterState} onChange={setFilterState} options={uniqOptions(partners.map((p) => p.state))} placeholder="Alle Bundesländer" />
                  <Select
                    label="Kategorie"
                    value={filterCategory}
                    onChange={(v) => {
                      setFilterCategory(v);
                      setFilterSubcategory("");
                    }}
                    options={categories.filter((c) => !c.parent).map((c) => ({ value: c.value, label: c.label }))}
                    placeholder="Alle Kategorien"
                  />
                  <Select
                    label="Unterkategorie"
                    value={filterSubcategory}
                    onChange={setFilterSubcategory}
                    options={categories.filter((c) => c.parent === filterCategory).map((c) => ({ value: c.value, label: c.label }))}
                    placeholder={filterCategory ? "Unterkategorie" : "Erst Kategorie wählen"}
                    disabled={!filterCategory}
                  />
                  <Select label="Kurstyp" value={filterType} onChange={setFilterType} options={types} placeholder="Alle Kurstypen" />
                  <Select label="Format" value={filterFormat} onChange={setFilterFormat} options={formats} placeholder="Alle Formate" />
                  <Select label="Sprache" value={filterLanguage} onChange={setFilterLanguage} options={languages} placeholder="Alle Sprachen" />
                </div>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center rounded-full border border-pink-500 text-pink-600 bg-white px-4 py-2 text-sm font-semibold hover:bg-pink-50 transition shadow-sm"
                >
                  Filter zurücksetzen
                </button>
              </div>
            </details>
          </div>

          {/* Desktop/Tablet Filters */}
          <div className="hidden sm:flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6 rounded-3xl bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur px-4 sm:px-5 py-4 border border-slate-200">
            <div className="grid w-full max-w-4xl gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Select label="Land" value={filterCountry} onChange={setFilterCountry} options={uniqOptions(partners.map((p) => p.country))} placeholder="Alle Länder" />
              <Select label="Bundesland" value={filterState} onChange={setFilterState} options={uniqOptions(partners.map((p) => p.state))} placeholder="Alle Bundesländer" />
              <Select
                label="Kategorie"
                value={filterCategory}
                onChange={(v) => {
                  setFilterCategory(v);
                  setFilterSubcategory("");
                }}
                options={categories.filter((c) => !c.parent).map((c) => ({ value: c.value, label: c.label }))}
                placeholder="Alle Kategorien"
              />
              <Select
                label="Unterkategorie"
                value={filterSubcategory}
                onChange={setFilterSubcategory}
                options={categories.filter((c) => c.parent === filterCategory).map((c) => ({ value: c.value, label: c.label }))}
                placeholder={filterCategory ? "Unterkategorie" : "Erst Kategorie wählen"}
                disabled={!filterCategory}
              />
              <Select label="Kurstyp" value={filterType} onChange={setFilterType} options={types} placeholder="Alle Kurstypen" />
              <Select label="Format" value={filterFormat} onChange={setFilterFormat} options={formats} placeholder="Alle Formate" />
              <Select label="Sprache" value={filterLanguage} onChange={setFilterLanguage} options={languages} placeholder="Alle Sprachen" />
            </div>
            <button
              onClick={resetFilters}
              className="inline-flex items-center rounded-full border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-50 transition shadow-sm"
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading && <p className="col-span-full text-sm text-slate-500">Lade Standorte…</p>}
          {!loading &&
            filtered.map((p) => {
              const hero = toUrl(p.hero1_path);
              const logo = toUrl(p.logo_path);
              return (
                <Link
                  key={p.id}
                  href={p.slug ? `/partner/${p.slug}` : "#"}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/60 transition hover:-translate-y-1.5 hover:shadow-xl hover:border-[#ff1f8f]/50"
                >
                  <div className="relative mb-4 h-44 w-full overflow-hidden rounded-xl border border-slate-200 bg-white flex items-center justify-center">
                    {hero ? (
                      <Image
                        src={hero}
                        alt={p.name}
                        fill
                        sizes="360px"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-50 text-lg font-semibold text-slate-500">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {logo && (
                      <div className="absolute right-2 top-2 flex h-12 w-12 items-center justify-center rounded-lg bg-white/85 shadow-sm">
                        <Image src={logo} alt={`${p.name} Logo`} fill sizes="64px" className="object-contain p-1.5" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#ff1f8f] line-clamp-2 leading-snug">{p.name}</h3>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{[p.state, p.country].filter(Boolean).join(" · ") || "Standort folgt"}</p>
                    <div className="flex flex-wrap gap-1.5 pt-3">
                      {(p.tags ?? []).slice(0, 4).map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {tag}
                        </span>
                      ))}
                      {(p.tags?.length ?? 0) > 4 && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                          +{(p.tags!.length - 4)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs font-semibold text-slate-500">Zum Partner</span>
                      <span className="h-8 w-8 rounded-full border border-[#ff1f8f]/40 bg-white text-[#ff1f8f] flex items-center justify-center text-xs font-bold transition group-hover:bg-[#ff1f8f] group-hover:text-white">
                        Go
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
              Keine Standorte für diese Filter gefunden.
            </div>
          )}
        </div>
      </section>

      <div className="mt-0">
        <ConsultBanner height="70vh" />
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  center,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  center?: boolean;
}) {
  return (
    <label className={`space-y-1 text-sm ${center ? "w-full" : ""}`}>
      {label ? <span className="text-slate-600">{label}</span> : null}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#ff1f8f] focus:outline-none ${
          center ? "text-center" : ""
        }`}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#ff1f8f] focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">{placeholder || "Alle"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function uniqOptions(values: (string | null)[]) {
  const set = new Set<string>();
  values.filter(Boolean).forEach((v) => set.add(v as string));
  return Array.from(set)
    .sort()
    .map((v) => ({ value: v, label: v }));
}
