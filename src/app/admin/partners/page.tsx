"use client";

import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";

type Instructor = {
  id: string;
  status: "active" | "inactive";
  name: string;
  role?: string | null;
  references?: string[] | null;
  image?: string | null;
};

type Partner = {
  id: string;
  status?: "active" | "inactive" | string | null;
  name: string;
  slug?: string | null;
  street?: string | null;
  zip?: string | null;
  city?: string | null;
  country?: string | null;
  state?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  tags?: string[] | null;
  references?: string[] | null;
  references_list?: string[] | null;
  logo_path?: string | null;
  hero1_path?: string | null;
  hero1_mobile_path?: string | null;
  gallery_paths?: string[] | null;
  promo_path?: string | null;
  promo_mobile_path?: string | null;
  slogan?: string | null;
  description?: string | null;
  genres?: string[] | null;
  instructor_profiles?: Instructor[] | null;
};

const countries = ["Österreich", "Deutschland"] as const;
const statesAT = ["Burgenland", "Kärnten", "Niederösterreich", "Oberösterreich", "Salzburg", "Steiermark", "Tirol", "Vorarlberg", "Wien"];
const statesDE = [
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
];
// Vorschlagsliste; Auswahl jetzt frei (Custom-Input möglich)
const GENRES = [
  "Pop",
  "Rock",
  "Hip-Hop",
  "R&B",
  "Soul",
  "Jazz",
  "Blues",
  "Electronic",
  "House",
  "Techno",
  "EDM",
  "Drum & Bass",
  "Trance",
  "Dubstep",
  "Reggae",
  "Dancehall",
  "Latin",
  "Reggaeton",
  "Schlager",
  "Volksmusik",
  "Klassik",
  "Filmmusik",
  "Indie",
  "Alternative",
  "Metal",
  "Punk",
  "Funk",
  "Gospel",
  "Country",
];

const emptyPartner: Partner = {
  id: "",
  name: "",
  status: "active",
  country: "Österreich",
  tags: [],
  references: [],
  gallery_paths: [],
  promo_path: null,
  instructor_profiles: [],
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");
  const [editing, setEditing] = useState<Partner | null>(null);
  const [tab, setTab] = useState<"stammdaten" | "medien" | "website" | "dozenten">("stammdaten");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"logo" | "hero" | "promo" | `gallery-${number}` | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      const s = search.toLowerCase();
      const matchesSearch =
        !s ||
        p.name.toLowerCase().includes(s) ||
        (p.city ?? "").toLowerCase().includes(s) ||
        (p.state ?? "").toLowerCase().includes(s);
      const matchesStatus = !filterStatus || (p.status ?? "") === filterStatus;
      const matchesCountry = !filterCountry || (p.country ?? "") === filterCountry;
      const matchesState = !filterState || (p.state ?? "") === filterState;
      return matchesSearch && matchesStatus && matchesCountry && matchesState;
    });
  }, [partners, search, filterStatus, filterCountry, filterState]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/partners");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fehler beim Laden");
      setPartners(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing({ ...emptyPartner, id: uuid() });
    setTab("stammdaten");
  };
  const openEdit = (p: Partner) => {
    setEditing({
      ...p,
      tags: p.tags ?? [],
      references: (p as any).references ?? (p as any).references_list ?? [],
      gallery_paths: p.gallery_paths ?? [],
      promo_path: p.promo_path ?? null,
      instructor_profiles: p.instructor_profiles ?? [],
    });
    setTab("stammdaten");
  };
  const closeModal = () => setEditing(null);

  const updateEdit = (patch: Partial<Partner>) => setEditing((prev) => (prev ? { ...prev, ...patch } : prev));

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setError("Name ist erforderlich");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...editing,
        slug: editing.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9äöüß -]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-"),
      };
      const res = await fetch("/api/admin/partners", {
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
    if (!id) {
      alert("ID fehlt");
      return;
    }
    if (!confirm("Diesen Partner wirklich löschen?")) return;
    const res = await fetch(`/api/admin/partners/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`Löschen fehlgeschlagen: ${j.error ?? res.status}`);
    }
    await load();
  };

  const addInstructor = () =>
    updateEdit({
      instructor_profiles: [
        ...(editing?.instructor_profiles ?? []),
        { id: uuid(), status: "active", name: "", role: "", image: "", references: [] },
      ],
    });

const updateInstructor = (id: string, patch: Partial<Instructor>) =>
    updateEdit({
      instructor_profiles: (editing?.instructor_profiles ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });

  const removeInstructor = (id: string) =>
    updateEdit({ instructor_profiles: (editing?.instructor_profiles ?? []).filter((t) => t.id !== id) });

  const uploadInstructorImage = async (file: File, instructorId: string) => {
    setUploadError(null);
    setUploading(`gallery-${instructorId}` as any);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", `dozent-${instructorId}`);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen");
      updateInstructor(instructorId, { image: data.url });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(null);
    }
  };

  const addGallery = () => {
    if ((editing?.gallery_paths?.length ?? 0) >= 5) return;
    updateEdit({ gallery_paths: [...(editing?.gallery_paths ?? []), ""] });
  };

  const updateGallery = (idx: number, value: string) =>
    updateEdit({
      gallery_paths: (editing?.gallery_paths ?? []).map((g, i) => (i === idx ? value : g)),
    });

  const removeGallery = (idx: number) =>
    updateEdit({
      gallery_paths: (editing?.gallery_paths ?? []).filter((_, i) => i !== idx),
    });

  const uploadFile = async (file: File, target: "logo" | "hero" | "promo" | number) => {
    if (!editing) return;
    setUploading(
      target === "logo"
        ? "logo"
        : target === "hero"
          ? "hero"
          : target === "promo"
            ? "promo"
            : (`gallery-${target}` as any),
    );
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append(
        "title",
        target === "logo"
          ? `logo-${editing.name}`
          : target === "hero"
            ? `hero-${editing.name}`
            : target === "promo"
              ? `promo-${editing.name}`
              : `gallery-${target}-${editing.name}`,
      );
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen");
      if (target === "logo") updateEdit({ logo_path: data.url });
      else if (target === "hero") updateEdit({ hero1_path: data.url });
      else if (target === "promo") updateEdit({ promo_path: data.url });
      else updateGallery(target, data.url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(null);
    }
  };

  const addTag = (tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    const next = Array.from(new Set([...(editing?.tags ?? []), clean])).slice(0, 5);
    updateEdit({ tags: next });
  };
  const removeTag = (tag: string) => updateEdit({ tags: (editing?.tags ?? []).filter((t) => t !== tag) });

  return (
    <div className="px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="tag">Admin</p>
            <h1 className="text-2xl font-semibold text-slate-900">Partner</h1>
            <p className="text-sm text-slate-500">Übersicht, Suche, Filter, Bearbeiten, Löschen.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={openNew}
              className="rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-black shadow-md shadow-[#ff1f8f]/30 hover:bg-[#e40073]"
            >
              + Neuen Partner anlegen
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
            <Input label="Suche (Name, Ort)" value={search} onChange={setSearch} />
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
              label="Land"
              value={filterCountry}
              onChange={(v) => {
                setFilterCountry(v);
                setFilterState("");
              }}
              options={[{ value: "", label: "Alle" }, ...countries.map((c) => ({ value: c, label: c }))]}
            />
            <Select
              label="Bundesland"
              value={filterState}
              onChange={setFilterState}
              options={[
                { value: "", label: "Alle" },
                ...((filterCountry === "Deutschland"
                  ? statesDE
                  : filterCountry === "Österreich"
                    ? statesAT
                    : statesAT.concat(statesDE)
                ).map((s) => ({ value: s, label: s }))),
              ]}
            />
          </div>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loading && <div className="text-sm text-slate-500">Lade…</div>}
            {!loading &&
              filtered.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900 line-clamp-2">{p.name}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {p.city ?? "—"} · {p.state ?? "—"} · {p.country ?? "—"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(p.tags ?? []).slice(0, 3).map((t) => (
                          <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span
                      className={
                        (p.status ?? "active") === "active"
                          ? "rounded-full px-2 py-0.5 text-[11px] font-semibold border border-emerald-200 text-emerald-700"
                          : "rounded-full px-2 py-0.5 text-[11px] font-semibold border border-amber-200 text-amber-700"
                      }
                    >
                      {p.status ?? "—"}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-[#ff1f8f] hover:text-[#ff1f8f]"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:border-red-400"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            {!loading && filtered.length === 0 && <div className="text-sm text-slate-500">Keine Partner gefunden.</div>}
          </div>
        </div>
      </div>

      {editing && (
        <Modal title={editing.name || "Neuer Partner"} onClose={closeModal}>
          <div className="space-y-4">
            <div className="flex gap-2 text-xs font-semibold">
              {["stammdaten", "medien", "website", "dozenten"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t as typeof tab)}
                  className={`rounded-full px-3 py-2 border transition ${
                    tab === t ? "border-[#ff1f8f] text-[#ff1f8f] bg-[#ff1f8f]/10" : "border-slate-200 text-slate-600 hover:border-[#ff1f8f]/50"
                  }`}
                >
                  {t === "stammdaten" ? "Stammdaten" : t === "medien" ? "Medien" : t === "website" ? "Website" : "Dozenten"}
                </button>
              ))}
            </div>

            {tab === "stammdaten" && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Select
                  label="Status"
                  value={editing.status ?? "active"}
                  onChange={(v) => updateEdit({ status: v as Partner["status"] })}
                  options={[
                    { value: "active", label: "Aktiv" },
                    { value: "inactive", label: "Inaktiv" },
                  ]}
                />
                <Input label="Name *" value={editing.name} onChange={(v) => updateEdit({ name: v })} required />
                <Input label="Straße" value={editing.street ?? ""} onChange={(v) => updateEdit({ street: v })} />
                <Input label="PLZ" value={editing.zip ?? ""} onChange={(v) => updateEdit({ zip: v })} />
                <Input label="Ort" value={editing.city ?? ""} onChange={(v) => updateEdit({ city: v })} />
                <Select
                  label="Land"
                  value={editing.country ?? "Österreich"}
                  onChange={(v) => {
                    updateEdit({ country: v, state: "" });
                  }}
                  options={countries.map((c) => ({ value: c, label: c }))}
                />
                <Select
                  label="Bundesland"
                  value={editing.state ?? ""}
                  onChange={(v) => updateEdit({ state: v })}
                  options={((editing.country ?? "Österreich") === "Deutschland" ? statesDE : statesAT).map((s) => ({ value: s, label: s }))}
                />
                <Input label="Website" value={editing.website ?? ""} onChange={(v) => updateEdit({ website: v })} />
                <Input label="Telefon" value={editing.phone ?? ""} onChange={(v) => updateEdit({ phone: v })} />
                <Input label="E-Mail" value={editing.email ?? ""} onChange={(v) => updateEdit({ email: v })} />
                <TagInput tags={editing.tags ?? []} onAdd={addTag} onRemove={removeTag} max={20} />
              </div>
            )}

            {tab === "medien" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Logo (jpg/png)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "logo")}
                      className="text-sm"
                    />
                  </div>
                  {uploading === "logo" && <span className="text-xs text-slate-500">Upload…</span>}
                  {editing.logo_path && <Preview url={editing.logo_path} label="Aktuelles Logo" />}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Hero-Bild (Desktop, jpg/png)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "hero")}
                      className="text-sm"
                    />
                  </div>
                  {uploading === "hero" && <span className="text-xs text-slate-500">Upload…</span>}
                  {editing.hero1_path && <Preview url={editing.hero1_path} label="Aktuelles Hero (Desktop)" />}
                  <Input
                    label="Hero mobil (URL, 1080x1920 empfohlen)"
                    value={editing.hero1_mobile_path ?? ""}
                    onChange={(v) => updateEdit({ hero1_mobile_path: v })}
                    placeholder="Optional separate Mobile-Version"
                  />
                  {editing.hero1_mobile_path && <Preview url={editing.hero1_mobile_path} label="Hero mobil" />}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Promo / Slogan (Bild oder Video-URL, Desktop)</label>
                  <div className="flex flex-col gap-2">
                    <input
                      value={editing.promo_path ?? ""}
                      onChange={(e) => updateEdit({ promo_path: e.target.value })}
                      placeholder="Direkte URL (Bild, mp4, Vimeo/YouTube)"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "promo")}
                        className="text-sm"
                      />
                      {uploading === "promo" && <span className="text-xs text-slate-500">Upload…</span>}
                    </div>
                  </div>
                  {editing.promo_path && <Preview url={editing.promo_path} label="Aktuelle Promo (Desktop)" />}
                  <Input
                    label="Promo / Video mobil (URL, 9:16 empfohlen)"
                    value={editing.promo_mobile_path ?? ""}
                    onChange={(v) => updateEdit({ promo_mobile_path: v })}
                    placeholder="Optionale Mobile-Version"
                  />
                  {editing.promo_mobile_path && <Preview url={editing.promo_mobile_path} label="Promo mobil" />}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">Galerie (max. 5)</span>
                    <button
                      onClick={addGallery}
                      disabled={(editing.gallery_paths?.length ?? 0) >= 5}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-[#ff1f8f] disabled:opacity-50"
                    >
                      + Slot
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(editing.gallery_paths ?? []).map((g, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                          <span>Element {idx + 1}</span>
                          <button onClick={() => removeGallery(idx)} className="text-red-500 hover:underline">
                            Entfernen
                          </button>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <input
                            value={g}
                            onChange={(e) => updateGallery(idx, e.target.value)}
                            placeholder="oder URL einfügen"
                            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
                          />
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], idx)}
                            className="text-sm"
                          />
                          {uploading === `gallery-${idx}` && <span className="text-xs text-slate-500">Upload…</span>}
                        </div>
                        {g && <Preview url={g} label="Vorschau" />}
                      </div>
                    ))}
                    {(editing.gallery_paths ?? []).length === 0 && <p className="text-sm text-slate-500">Noch keine Galerie-Elemente.</p>}
                  </div>
                </div>
                {uploadError && <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{uploadError}</div>}
              </div>
            )}

            {tab === "website" && (
              <div className="space-y-3">
                <Input label="Slogan" value={editing.slogan ?? ""} onChange={(v) => updateEdit({ slogan: v })} />
                <Textarea label="Beschreibung" value={editing.description ?? ""} onChange={(v) => updateEdit({ description: v })} />
                <MultiTagPicker
                  label="Genres (max. 5)"
                  options={GENRES}
                  values={editing.genres ?? []}
                  max={20}
                  onChange={(vals) => updateEdit({ genres: vals })}
                />
                <TagInput
                  label="Referenzen (frei) – Enter zum Hinzufügen"
                  tags={editing.references ?? []}
                  onAdd={(t) => updateEdit({ references: Array.from(new Set([...(editing.references ?? []), t])) })}
                  onRemove={(t) => updateEdit({ references: (editing.references ?? []).filter((x) => x !== t) })}
                  max={50}
                />
              </div>
            )}

            {tab === "dozenten" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Dozenten</p>
                  <button
                    onClick={addInstructor}
                    className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    + Dozent
                  </button>
                </div>
                <div className="space-y-3">
                  {(editing.instructor_profiles ?? []).map((d) => (
                    <div key={d.id} className="rounded-xl border border-slate-200 p-3 shadow-sm">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Dozent</span>
                        <button onClick={() => removeInstructor(d.id)} className="text-red-500 hover:underline">
                          Entfernen
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                        <Input label="Name" value={d.name} onChange={(v) => updateInstructor(d.id, { name: v })} />
                        <Input label="Funktion" value={d.role ?? ""} onChange={(v) => updateInstructor(d.id, { role: v })} />
                        <TagInput
                          label="Referenzen"
                          tags={d.references ?? []}
                          onAdd={(t) =>
                            updateInstructor(d.id, {
                              references: Array.from(new Set([...(d.references ?? []), t])).slice(0, 20),
                            })
                          }
                          onRemove={(t) =>
                            updateInstructor(d.id, {
                              references: (d.references ?? []).filter((x) => x !== t),
                            })
                          }
                          max={20}
                        />
                        <div className="space-y-1 text-sm">
                          <span className="text-slate-600">Bild (Upload)</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && uploadInstructorImage(e.target.files[0], d.id)}
                              className="text-xs"
                            />
                            {uploading === `gallery-${d.id}` && <span className="text-xs text-slate-500">Upload…</span>}
                          </div>
                          {d.image && <Preview url={d.image} label="Vorschau" />}
                        </div>
                        <Select
                          label="Status"
                          value={d.status}
                          onChange={(v) => updateInstructor(d.id, { status: v as Instructor["status"] })}
                          options={[
                            { value: "active", label: "Aktiv" },
                            { value: "inactive", label: "Inaktiv" },
                          ]}
                        />
                      </div>
                    </div>
                  ))}
                  {(editing.instructor_profiles ?? []).length === 0 && <p className="text-sm text-slate-500">Noch keine Dozenten.</p>}
                </div>
              </div>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
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
        rows={4}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#ff1f8f] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TagInput({
  label = "Tags (max. 50) – Enter zum Hinzufügen",
  tags,
  onAdd,
  onRemove,
  max = 50,
}: {
  label?: string;
  tags: string[];
  onAdd: (t: string) => void;
  onRemove: (t: string) => void;
  max?: number;
}) {
  const [value, setValue] = useState("");
  const add = () => {
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue("");
  };
  return (
    <div className="space-y-2">
      <label className="space-y-1 text-sm block">
        <span className="text-slate-600">{label.replace("{max}", String(max))}</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Tag eintippen und Enter"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#ff1f8f] focus:outline-none"
        />
      </label>
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

function MultiTagPicker({
  label,
  options,
  values,
  max = 5,
  onChange,
}: {
  label: string;
  options: string[];
  values: string[];
  max?: number;
  onChange: (v: string[]) => void;
}) {
  const toggle = (val: string) => {
    const exists = values.includes(val);
    let next = exists ? values.filter((v) => v !== val) : [...values, val];
    if (next.length > max) next = next.slice(0, max);
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                active ? "border-[#ff1f8f] bg-[#ff1f8f]/10 text-[#ff1f8f]" : "border-slate-200 text-slate-700 hover:border-[#ff1f8f]/50"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500">Ausgewählt: {values.length}/{max}</p>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3">
          <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-900">
            Schließen
          </button>
        </div>
        <div className="max-h-[75vh] overflow-auto pr-1">{children}</div>
      </div>
    </div>
  );
}

function Preview({ url, label }: { url: string; label?: string }) {
  const isVideo = url.match(/\\.(mp4|mov|webm)$/i);
  return (
    <div className="space-y-1">
      {label && <p className="text-xs font-semibold text-slate-600">{label}</p>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {isVideo ? (
          <video src={url} className="h-36 w-full object-cover" controls />
        ) : (
          <img src={url} className="h-36 w-full object-cover" alt={label ?? "preview"} />
        )}
      </div>
      <p className="text-[11px] text-slate-500 break-all">{url}</p>
    </div>
  );
}
