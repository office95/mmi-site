// Kurse Admin Seite mit Preisklassen, Add-ons, Stammdaten-Selects
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import RichTextEditor from "@/components/RichTextEditor";

type Course = {
  id: string;
  status?: "active" | "inactive" | string;
  title: string;
  slug?: string | null;
  region?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  type_id?: string | null;
  format_id?: string | null;
  duration_hours?: number | null;
  hero_image_url?: string | null;
  hero_image_mobile_url?: string | null;
  slogan_image_url?: string | null;
  slogan_image_mobile_url?: string | null;
  slogan_image_text?: string | null;
  slogan_line1?: string | null;
  slogan_line2?: string | null;
  slogan_line3?: string | null;
  subtitle?: string | null;
  summary?: string | null;
  key_facts?: string[];
  content?: string | null;
  audience?: string | null;
  base_price_cents?: number | null;
  deposit_cents?: number | null;
  tax_rate?: number | null;
  price_tiers?: PriceTier[];
  addons?: Addon[];
  tags?: string[];
  faqs?: { question: string; answer: string }[];
  modules?: { title: string; hours: number | null }[];
};

type PriceTier = {
  id: string;
  label: string;
  description?: string | null;
  price_cents?: number | null;
  deposit_cents?: number | null;
  tax_rate?: number | null;
};

type Addon = {
  id: string;
  name: string;
  price_cents?: number | null;
  price_input?: string;
  description?: string | null;
  image_url?: string | null;
  tax_rate?: number | null;
};

const emptyCourse: Course = {
  id: "",
  status: "active",
  title: "",
  region: null,
  category_id: null,
  subcategory_id: null,
  type_id: null,
  format_id: null,
  duration_hours: null,
  hero_image_url: null,
  hero_image_mobile_url: null,
  slogan_image_url: null,
  slogan_image_mobile_url: null,
  slogan_image_text: "",
  slogan_line1: null,
  slogan_line2: null,
  slogan_line3: null,
  subtitle: "",
  summary: "",
  key_facts: [],
  content: "",
  audience: "",
  base_price_cents: 0,
  deposit_cents: null,
  tax_rate: null,
  price_tiers: [],
  addons: [],
  tags: [],
  faqs: [],
  modules: [],
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [editing, setEditing] = useState<Course | null>(null);
  const [tab, setTab] = useState<"stammdaten" | "website" | "medien" | "preise" | "addons" | "tags" | "faqs" | "inhalt">("stammdaten");
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string; parent_id: string | null }[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [formats, setFormats] = useState<{ id: string; name: string }[]>([]);
  const [uploading, setUploading] = useState<"hero" | "heroMobile" | "slogan" | null>(null);
  const regionOptions = [
    { value: "", label: "Global (AT+DE)" },
    { value: "AT", label: "Österreich" },
    { value: "DE", label: "Deutschland" },
  ];

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const s = search.toLowerCase();
      const matchesSearch = !s || c.title.toLowerCase().includes(s);
      const matchesStatus = !filterStatus || (c.status ?? "") === filterStatus;
      const matchesCat = !filterCategory || (c.category_id ?? "") === filterCategory;
      const matchesType = !filterType || (c.type_id ?? "") === filterType;
      const matchesFormat = !filterFormat || (c.format_id ?? "") === filterFormat;
      const matchesRegion = !filterRegion || (c.region ?? "") === filterRegion || (filterRegion === "NULL" && !c.region);
      return matchesSearch && matchesStatus && matchesCat && matchesType && matchesFormat && matchesRegion;
    });
  }, [courses, search, filterStatus, filterCategory, filterType, filterFormat, filterRegion]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/courses");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fehler beim Laden");
      setCourses(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const fetchTax = async () => {
      const [cRes, tRes, fRes] = await Promise.all([
        fetch("/api/admin/course-categories"),
        fetch("/api/admin/course-types"),
        fetch("/api/admin/course-formats"),
      ]);
      if (cRes.ok) setCategories((await cRes.json()).data ?? []);
      if (tRes.ok) setTypes((await tRes.json()).data ?? []);
      if (fRes.ok) setFormats((await fRes.json()).data ?? []);
    };
    fetchTax();
  }, []);

  const openNew = () => {
    setEditing({ ...emptyCourse, id: uuid() });
    setTab("stammdaten");
  };
  const openEdit = (c: Course) => {
    setEditing({
      ...c,
      key_facts: c.key_facts ?? [],
      addons: c.addons ?? [],
      price_tiers: c.price_tiers ?? [],
      tags: c.tags ?? [],
    });
    setTab("stammdaten");
  };
  const closeModal = () => setEditing(null);

  const updateEdit = (patch: Partial<Course>) => setEditing((prev) => (prev ? { ...prev, ...patch } : prev));

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      setError("Titel ist erforderlich");
      return;
    }
    const payload: Course = {
      ...editing,
      slogan_line1: editing.slogan_line1?.trim() || null,
      slogan_line2: editing.slogan_line2?.trim() || null,
      slogan_line3: editing.slogan_line3?.trim() || null,
    };
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Speichern fehlgeschlagen");
      await load();
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Diesen Kurs wirklich löschen?")) return;
    await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    await load();
  };

  const newAddon = (): Addon => ({ id: uuid(), name: "", price_cents: null, price_input: "", description: "", image_url: "", tax_rate: null });
  const newPriceTier = (): PriceTier => ({ id: uuid(), label: "", description: "", price_cents: null, deposit_cents: null, tax_rate: null });

  const patchAddon = (id: string, patch: Partial<Addon>) =>
    updateEdit({ addons: (editing?.addons ?? []).map((a) => (a.id === id ? { ...a, ...patch } : a)) });

  const patchPriceTier = (id: string, patch: Partial<PriceTier>) =>
    updateEdit({ price_tiers: (editing?.price_tiers ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)) });

  const uploadHero = async (file: File) => {
    if (!editing) return;
    setUploading("hero");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", `course-hero-${editing.title}`);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen");
      updateEdit({ hero_image_url: data.url });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(null);
    }
  };

  const uploadHeroMobile = async (file: File) => {
    if (!editing) return;
    setUploading("heroMobile");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", `course-hero-mobile-${editing.title}`);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen");
      updateEdit({ hero_image_mobile_url: data.url });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(null);
    }
  };

  const uploadSlogan = async (file: File) => {
    if (!editing) return;
    setUploading("slogan");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", `course-slogan-${editing.title}`);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen");
      updateEdit({ slogan_image_url: data.url });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="tag">Admin</p>
            <h1 className="text-2xl font-semibold text-slate-900">Kurse</h1>
            <p className="text-sm text-slate-500">Übersicht, Filter, Bearbeiten, Löschen.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={openNew}
              className="rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-black shadow-md shadow-[#ff1f8f]/30 hover:bg-[#e40073]"
            >
              + Neuen Kurs anlegen
            </button>
            <button
              onClick={load}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#ff1f8f] hover:text-[#ff1f8f]"
            >
              Reload
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Input label="Suche (Titel)" value={search} onChange={setSearch} />
            <Select
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: "", label: "Alle" },
                { value: "active", label: "Aktiv" },
                { value: "inactive", label: "Inaktiv" },
              ]}
            />
            <Select
              label="Kategorie"
              value={filterCategory}
              onChange={setFilterCategory}
              options={[{ value: "", label: "Alle" }, ...categories.filter((c) => !c.parent_id).map((c) => ({ value: c.id, label: c.name }))]}
            />
            <Select
              label="Kurstyp"
              value={filterType}
              onChange={setFilterType}
              options={[{ value: "", label: "Alle" }, ...types.map((t) => ({ value: t.id, label: t.name }))]}
            />
            <Select
              label="Format"
              value={filterFormat}
              onChange={setFilterFormat}
              options={[{ value: "", label: "Alle" }, ...formats.map((f) => ({ value: f.id, label: f.name }))]}
            />
            <Select
              label="Region"
              value={filterRegion}
              onChange={setFilterRegion}
              options={[
                { value: "", label: "Alle" },
                { value: "AT", label: "Österreich" },
                { value: "DE", label: "Deutschland" },
                { value: "NULL", label: "Global (leer)" },
              ]}
            />
          </div>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loading && <div className="text-sm text-slate-500">Lade…</div>}
            {!loading &&
              filtered.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 line-clamp-2">{c.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {getName(c.category_id, categories) ?? "–"} · {getName(c.type_id, types) ?? "—"} · {getName(c.format_id, formats) ?? "—"}
                      </p>
                    </div>
                    <span
                      className={
                        (c.status ?? "active") === "active"
                          ? "rounded-full px-2 py-0.5 text-[11px] font-semibold border border-emerald-200 text-emerald-700"
                          : "rounded-full px-2 py-0.5 text-[11px] font-semibold border border-amber-200 text-amber-700"
                      }
                    >
                      {c.status ?? "—"}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-[#ff1f8f] hover:text-[#ff1f8f]"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => remove(c.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:border-red-400"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            {!loading && filtered.length === 0 && <div className="text-sm text-slate-500">Keine Kurse gefunden.</div>}
          </div>
        </div>
      </div>

      {editing && (
        <Modal onClose={closeModal} title={editing.title ? "Kurs bearbeiten" : "Neuer Kurs"}>
          <div className="space-y-4">
            <div className="flex gap-2 text-xs font-semibold flex-wrap">
              {[
                { id: "stammdaten", label: "Stammdaten" },
                { id: "website", label: "Website" },
                { id: "medien", label: "Medien" },
                { id: "preise", label: "Preis" },
                { id: "addons", label: "Add-ons" },
                { id: "tags", label: "Tags" },
                { id: "faqs", label: "FAQs", onlyType: "Intensiv" },
                { id: "inhalt", label: "Kursinhalt", onlyType: "Intensiv" },
              ]
                .filter((t) => !t.onlyType || getName(editing?.type_id, types) === t.onlyType || editing?.type_id === t.onlyType)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id as typeof tab)}
                    className={`rounded-full px-3 py-2 border transition ${
                      tab === t.id ? "border-[#ff1f8f] text-[#ff1f8f] bg-[#ff1f8f]/10" : "border-slate-200 text-slate-600 hover:border-[#ff1f8f]/50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
            </div>

            {tab === "stammdaten" && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Select
                  label="Status"
                  value={editing.status ?? "active"}
                  onChange={(v) => updateEdit({ status: v as Course["status"] })}
                  options={[
                    { value: "active", label: "Aktiv" },
                    { value: "inactive", label: "Inaktiv" },
                  ]}
                />
                <Select
                  label="Region"
                  value={editing.region ?? ""}
                  onChange={(v) => updateEdit({ region: v || null })}
                  options={regionOptions}
                />
                <Input label="Titel *" value={editing.title} onChange={(v) => updateEdit({ title: v })} required />
                <Select
                  label="Kategorie"
                  value={editing.category_id ?? ""}
                  onChange={(v) => updateEdit({ category_id: v || null, subcategory_id: v ? editing.subcategory_id : null })}
                  options={categories.filter((c) => !c.parent_id).map((c) => ({ value: c.id, label: c.name }))}
                  placeholder={categories.length ? "Kategorie wählen" : "Erst Stammdaten › Kategorie anlegen"}
                  disabled={!categories.length}
                />
                <Select
                  label="Unterkategorie"
                  value={editing.subcategory_id ?? ""}
                  onChange={(v) => updateEdit({ subcategory_id: v || null })}
                  options={
                    editing.category_id
                      ? categories.filter((c) => c.parent_id === editing.category_id).map((c) => ({ value: c.id, label: c.name }))
                      : []
                  }
                  placeholder={
                    !editing.category_id
                      ? "Erst Kategorie wählen"
                      : categories.some((c) => c.parent_id === editing.category_id)
                        ? "Unterkategorie wählen"
                        : "Keine Unterkategorie vorhanden"
                  }
                  disabled={!editing.category_id || !categories.some((c) => c.parent_id === editing.category_id)}
                />
                <Select
                  label="Kurstyp"
                  value={editing.type_id ?? ""}
                  onChange={(v) => updateEdit({ type_id: v || null })}
                  options={types.map((t) => ({ value: t.id, label: t.name }))}
                  placeholder={types.length ? "Workshop, Diploma..." : "Erst Stammdaten › Kurstyp anlegen"}
                  disabled={!types.length}
                />
                <Select
                  label="Format"
                  value={editing.format_id ?? ""}
                  onChange={(v) => updateEdit({ format_id: v || null })}
                  options={formats.map((f) => ({ value: f.id, label: f.name }))}
                  placeholder={formats.length ? "Präsenz, Online, Hybrid…" : "Erst Stammdaten › Format anlegen"}
                  disabled={!formats.length}
                />
                <Input
                  label="Kursdauer (Stunden)"
                  value={editing.duration_hours?.toString() ?? ""}
                  onChange={(v) => updateEdit({ duration_hours: v ? Number(v) : null })}
                  placeholder="z.B. 24"
                />
              </div>
            )}

            {tab === "website" && (
              <div className="grid grid-cols-1 gap-4">
                <Input label="Subtitel" value={editing.subtitle ?? ""} onChange={(v) => updateEdit({ subtitle: v })} />
                <RichTextEditor label="Beschreibung (unter Überschrift)" value={editing.summary ?? ""} onChange={(v) => updateEdit({ summary: v })} />
                <RichTextEditor label="Kursinhalt" value={editing.content ?? ""} onChange={(v) => updateEdit({ content: v })} />
                <RichTextEditor label="Für wen ist der Kurs?" value={editing.audience ?? ""} onChange={(v) => updateEdit({ audience: v })} />
                <KeyFacts facts={editing.key_facts ?? []} onChange={(facts) => updateEdit({ key_facts: facts.slice(0, 5) })} />
              </div>
            )}

            {tab === "medien" && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-700">Kursbild (Desktop)</label>
                  <div className="flex items-center gap-3">
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadHero(e.target.files[0])} className="text-sm" />
                    {uploading === "hero" && <span className="text-xs text-slate-500">Upload…</span>}
                  </div>
                  {editing.hero_image_url && (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img src={editing.hero_image_url} className="h-48 w-full object-cover" alt="Hero" />
                    <p className="text-[11px] text-slate-500 px-2 py-1 break-all">{editing.hero_image_url}</p>
                  </div>
                )}
                  <label className="text-sm font-semibold text-slate-700">Kursbild mobil</label>
                  <div className="flex items-center gap-3">
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadHeroMobile(e.target.files[0])} className="text-sm" />
                    {uploading === "heroMobile" && <span className="text-xs text-slate-500">Upload…</span>}
                  </div>
                  <Input
                    label="oder URL (optional)"
                    value={editing.hero_image_mobile_url ?? ""}
                    onChange={(v) => updateEdit({ hero_image_mobile_url: v })}
                    placeholder="Falls externes Bild genutzt wird"
                  />
                  {editing.hero_image_mobile_url && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <img src={editing.hero_image_mobile_url} className="h-48 w-full object-cover" alt="Hero Mobile" />
                      <p className="text-[11px] text-slate-500 px-2 py-1 break-all">{editing.hero_image_mobile_url}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-700">Sloganbild / Video (Desktop)</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && uploadSlogan(e.target.files[0])}
                        className="text-sm"
                      />
                      {uploading === "slogan" && <span className="text-xs text-slate-500">Upload…</span>}
                    </div>
                    <input
                      type="url"
                      placeholder="oder externe URL einfügen (Bild oder Video)"
                      value={editing.slogan_image_url ?? ""}
                      onChange={(e) => updateEdit({ slogan_image_url: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  {editing.slogan_image_url && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {/\.(mp4|mov|webm)$/i.test(editing.slogan_image_url) ? (
                        <video src={editing.slogan_image_url} className="h-48 w-full object-cover" controls />
                      ) : (
                        <img src={editing.slogan_image_url} className="h-48 w-full object-cover" alt="Slogan" />
                      )}
                      <p className="text-[11px] text-slate-500 px-2 py-1 break-all">{editing.slogan_image_url}</p>
                    </div>
                  )}
                  <Input
                    label="Sloganbild / Video mobil (URL, 9:16 empfohlen)"
                    value={editing.slogan_image_mobile_url ?? ""}
                    onChange={(v) => updateEdit({ slogan_image_mobile_url: v })}
                    placeholder="Optional separate Mobile-Version"
                  />
                  {editing.slogan_image_mobile_url && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {/\.(mp4|mov|webm)$/i.test(editing.slogan_image_mobile_url) ? (
                        <video src={editing.slogan_image_mobile_url} className="h-48 w-full object-cover" controls />
                      ) : (
                        <img src={editing.slogan_image_mobile_url} className="h-48 w-full object-cover" alt="Slogan Mobile" />
                      )}
                      <p className="text-[11px] text-slate-500 px-2 py-1 break-all">{editing.slogan_image_mobile_url}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Input label="Slogan Zeile 1" value={editing.slogan_line1 ?? ""} onChange={(v) => updateEdit({ slogan_line1: v })} />
                    <Input label="Slogan Zeile 2" value={editing.slogan_line2 ?? ""} onChange={(v) => updateEdit({ slogan_line2: v })} />
                    <Input label="Slogan Zeile 3 (klein)" value={editing.slogan_line3 ?? ""} onChange={(v) => updateEdit({ slogan_line3: v })} />
                  </div>
                </div>
              </div>
            )}

            {tab === "preise" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Input
                    label="Standard Kursbeitrag (EUR)"
                    value={editing.base_price_cents ? (editing.base_price_cents / 100).toString() : ""}
                    onChange={(v) => updateEdit({ base_price_cents: v ? Math.round(parseFloat(v) * 100) : 0 })}
                  />
                  <Input
                    label="Standard Anzahlung (EUR)"
                    value={editing.deposit_cents ? (editing.deposit_cents / 100).toString() : ""}
                    onChange={(v) => updateEdit({ deposit_cents: v ? Math.round(parseFloat(v) * 100) : null })}
                  />
                  <Input label="Standard Steuersatz (%)" value={editing.tax_rate?.toString() ?? ""} onChange={(v) => updateEdit({ tax_rate: v ? Number(v) : null })} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Preisklassen</p>
                    <button onClick={() => updateEdit({ price_tiers: [...(editing.price_tiers ?? []), newPriceTier()] })} className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700">
                      + Preisklasse
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(editing.price_tiers ?? []).map((p) => (
                      <div key={p.id} className="rounded-xl border border-slate-200 p-3 shadow-sm">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Preisklasse</span>
                          <button onClick={() => updateEdit({ price_tiers: (editing.price_tiers ?? []).filter((x) => x.id !== p.id) })} className="text-red-500 hover:underline">
                            Entfernen
                          </button>
                        </div>
                        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                          <Input label="Bezeichnung" value={p.label} onChange={(v) => patchPriceTier(p.id, { label: v })} />
                          <Input
                            label="Preis (EUR)"
                            value={p.price_cents ? (p.price_cents / 100).toString() : ""}
                            onChange={(v) => patchPriceTier(p.id, { price_cents: v ? Math.round(parseFloat(v) * 100) : null })}
                          />
                          <Input
                            label="Anzahlung (EUR)"
                            value={p.deposit_cents ? (p.deposit_cents / 100).toString() : ""}
                            onChange={(v) => patchPriceTier(p.id, { deposit_cents: v ? Math.round(parseFloat(v) * 100) : null })}
                          />
                          <Input
                            label="Steuersatz (%)"
                            value={p.tax_rate?.toString() ?? ""}
                            onChange={(v) => patchPriceTier(p.id, { tax_rate: v ? Number(v) : null })}
                          />
                        </div>
                        <Textarea label="Beschreibung" value={p.description ?? ""} onChange={(v) => patchPriceTier(p.id, { description: v })} />
                      </div>
                    ))}
                    {(editing.price_tiers ?? []).length === 0 && <p className="text-sm text-slate-500">Noch keine Preisklassen.</p>}
                  </div>
                </div>
              </div>
            )}

            {tab === "addons" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Add-ons</p>
                  <button
                    onClick={() => updateEdit({ addons: [...(editing.addons ?? []), newAddon()] })}
                    className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    + Add-on
                  </button>
                </div>
                <div className="space-y-3">
                  {(editing.addons ?? []).map((a) => (
                    <div key={a.id} className="rounded-xl border border-slate-200 p-3 shadow-sm">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Add-on</span>
                        <button onClick={() => updateEdit({ addons: (editing.addons ?? []).filter((x) => x.id !== a.id) })} className="text-red-500 hover:underline">
                          Entfernen
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-6">
                        <Input label="Name" value={a.name} onChange={(v) => patchAddon(a.id, { name: v })} />
                        <Input
                          label="Preis Brutto (EUR)"
                          value={a.price_input ?? (a.price_cents ? (a.price_cents / 100).toString() : "")}
                          onChange={(v) => {
                            const num = v ? parseFloat(v.replace(",", ".")) : NaN;
                            patchAddon(a.id, {
                              price_input: v,
                              price_cents: Number.isFinite(num) ? Math.round(num * 100) : null,
                            });
                          }}
                        />
                        <Input label="MwSt. (%)" value={a.tax_rate?.toString() ?? ""} onChange={(v) => {
                          const num = v ? parseFloat(v.replace(",", ".")) : NaN;
                          patchAddon(a.id, { tax_rate: Number.isFinite(num) ? num : null });
                        }} />
                        {(() => {
                          const gross = (a.price_cents ?? 0) / 100;
                          const rate = a.tax_rate ?? 0;
                          const net = rate > -100 ? gross / (1 + rate / 100) : gross;
                          const vat = Math.max(gross - net, 0);
                          return (
                            <>
                              <Input label="MwSt. (EUR)" value={gross ? vat.toFixed(2) : ""} onChange={() => {}} />
                              <Input label="Preis Netto (EUR)" value={gross ? net.toFixed(2) : ""} onChange={() => {}} />
                            </>
                          );
                        })()}
                        <Input label="Bild URL" value={a.image_url ?? ""} onChange={(v) => patchAddon(a.id, { image_url: v || null })} />
                        <div className="md:col-span-6">
                          <Textarea label="Beschreibung" value={a.description ?? ""} onChange={(v) => patchAddon(a.id, { description: v })} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(editing.addons ?? []).length === 0 && <p className="text-sm text-slate-500">Noch keine Add-ons.</p>}
                </div>
              </div>
            )}

            {tab === "tags" && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">Tags (Enter zum Hinzufügen)</p>
                <TagInput
                  tags={editing.tags ?? []}
                  onAdd={(t) => updateEdit({ tags: Array.from(new Set([...(editing.tags ?? []), t])) })}
                  onRemove={(t) => updateEdit({ tags: (editing.tags ?? []).filter((x) => x !== t) })}
                />
              </div>
            )}

            {tab === "faqs" && (
              <FAQsEditor
                faqs={editing.faqs ?? []}
                onChange={(faqs) => updateEdit({ faqs })}
                disabled={getName(editing?.type_id, types) !== "Intensiv"}
              />
            )}

            {tab === "inhalt" && (
              <ModulesEditor
                modules={editing.modules ?? []}
                onChange={(modules) => updateEdit({ modules })}
                disabled={getName(editing?.type_id, types) !== "Intensiv"}
              />
            )}

            <div className="pt-3 flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-black shadow-md shadow-[#ff1f8f]/30 hover:bg-[#e40073] disabled:opacity-60"
              >
                {saving ? "Speichern…" : "Speichern"}
              </button>
              <button onClick={closeModal} className="text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900">
                Abbrechen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  placeholder,
  readOnly,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        readOnly={readOnly}
        type={type || "text"}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#ff1f8f] focus:outline-none"
      />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#ff1f8f] focus:outline-none"
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
  options: { value: string; label: string }[];
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
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TagInput({ tags, onAdd, onRemove }: { tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void }) {
  const [value, setValue] = useState("");
  const add = () => {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue("");
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Tag eingeben und Enter"
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
        />
        <button onClick={add} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">
          Hinzufügen
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {t}
            <button onClick={() => onRemove(t)} className="text-slate-500 hover:text-red-500">
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-slate-500">Noch keine Tags.</span>}
      </div>
    </div>
  );
}

function FAQsEditor({
  faqs,
  onChange,
  disabled,
}: {
  faqs: { question: string; answer: string }[];
  onChange: (faqs: { question: string; answer: string }[]) => void;
  disabled?: boolean;
}) {
  const add = () => onChange([...(faqs ?? []), { question: "", answer: "" }]);
  const update = (idx: number, patch: Partial<{ question: string; answer: string }>) =>
    onChange(faqs.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  const remove = (idx: number) => onChange(faqs.filter((_, i) => i !== idx));
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-700">FAQs</p>
      <div className="space-y-2">
        {faqs.map((f, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 p-3 shadow-sm space-y-2 bg-white/80">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>FAQ {idx + 1}</span>
              <button onClick={() => remove(idx)} disabled={disabled} className="text-red-500 hover:underline disabled:opacity-50">
                Entfernen
              </button>
            </div>
            <Input label="Frage" value={f.question} onChange={(v) => update(idx, { question: v })} />
            <Textarea label="Antwort" value={f.answer} onChange={(v) => update(idx, { answer: v })} />
          </div>
        ))}
        {faqs.length === 0 && <p className="text-xs text-slate-500">Noch keine FAQs.</p>}
      </div>
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-[#ff1f8f] hover:text-[#ff1f8f] disabled:opacity-50"
        >
          + FAQ hinzufügen
        </button>
      </div>
    </div>
  );
}

function ModulesEditor({
  modules,
  onChange,
  disabled,
}: {
  modules: { title: string; hours: number | null }[];
  onChange: (modules: { title: string; hours: number | null }[]) => void;
  disabled?: boolean;
}) {
  const add = () => onChange([...(modules ?? []), { title: "", hours: null }]);
  const update = (idx: number, patch: Partial<{ title: string; hours: number | null }>) =>
    onChange(modules.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  const remove = (idx: number) => onChange(modules.filter((_, i) => i !== idx));
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-700">Kursinhalt (Module)</p>
      <div className="space-y-2">
        {modules.map((m, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 p-3 shadow-sm space-y-2 bg-white/80">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Modul {idx + 1}</span>
              <button onClick={() => remove(idx)} disabled={disabled} className="text-red-500 hover:underline disabled:opacity-50">
                Entfernen
              </button>
            </div>
            <Input label="Thema" value={m.title} onChange={(v) => update(idx, { title: v })} />
            <Input
              label="Dauer (Stunden)"
              value={m.hours !== null && m.hours !== undefined ? String(m.hours) : ""}
              onChange={(v) => update(idx, { hours: v ? Number(v) : null })}
              placeholder="z.B. 4"
            />
          </div>
        ))}
        {modules.length === 0 && <p className="text-xs text-slate-500">Noch keine Module.</p>}
      </div>
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-[#ff1f8f] hover:text-[#ff1f8f] disabled:opacity-50"
        >
          + Modul hinzufügen
        </button>
      </div>
    </div>
  );
}
function KeyFacts({ facts, onChange }: { facts: string[]; onChange: (f: string[]) => void }) {
  const update = (idx: number, val: string) => onChange(facts.map((f, i) => (i === idx ? val : f)));
  const add = () => {
    if (facts.length >= 5) return;
    onChange([...facts, ""]);
  };
  const remove = (idx: number) => onChange(facts.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2 md:col-span-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Key-Facts (max. 5)</p>
        <button onClick={add} disabled={facts.length >= 5} className="text-xs font-semibold text-slate-700 underline disabled:opacity-50">
          + Fact
        </button>
      </div>
      <div className="space-y-2">
        {facts.map((f, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={f}
              onChange={(e) => update(i, e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
              placeholder={`Key Fact ${i + 1}`}
            />
            <button onClick={() => remove(i)} className="rounded-lg border border-red-200 px-2 text-xs font-semibold text-red-600">
              ✕
            </button>
          </div>
        ))}
        {facts.length === 0 && <p className="text-xs text-slate-500">Noch keine Key-Facts.</p>}
      </div>
    </div>
  );
}

function getName(id: string | null | undefined, list: { id: string; name: string }[]) {
  if (!id) return null;
  return list.find((c) => c.id === id)?.name ?? null;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">✕</button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
