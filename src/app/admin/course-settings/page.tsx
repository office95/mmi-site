"use client";

import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

type Category = { id: string; name: string; parent_id: string | null };
type Simple = { id: string; name: string };

export default function CourseSettingsPage() {
  const [tab, setTab] = useState<"categories" | "types" | "formats" | "languages">("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<Simple[]>([]);
  const [formats, setFormats] = useState<Simple[]>([]);
  const [languages, setLanguages] = useState<Simple[]>([]);
  const [catForm, setCatForm] = useState<Partial<Category>>({});
  const [typeForm, setTypeForm] = useState<Partial<Simple>>({});
  const [fmtForm, setFmtForm] = useState<Partial<Simple>>({});
  const [langForm, setLangForm] = useState<Partial<Simple>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cRes, tRes, fRes, lRes] = await Promise.all([
        fetch("/api/admin/course-categories"),
        fetch("/api/admin/course-types"),
        fetch("/api/admin/course-formats"),
        fetch("/api/admin/course-languages"),
      ]);
      if (cRes.ok) setCategories((await cRes.json()).data ?? []);
      if (tRes.ok) setTypes((await tRes.json()).data ?? []);
      if (fRes.ok) setFormats((await fRes.json()).data ?? []);
      if (lRes.ok) setLanguages((await lRes.json()).data ?? []);
      if (!cRes.ok || !tRes.ok || !fRes.ok || !lRes.ok) setError("Laden teilweise fehlgeschlagen.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveCategory = async () => {
    if (!catForm.name?.trim()) return;
    const res = await fetch("/api/admin/course-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...catForm, id: catForm.id ?? uuid() }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Speichern fehlgeschlagen (Kategorie)");
      return;
    }
    setCatForm({});
    load();
  };

  const saveType = async () => {
    if (!typeForm.name?.trim()) return;
    const res = await fetch("/api/admin/course-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...typeForm, id: typeForm.id ?? uuid() }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Speichern fehlgeschlagen (Kurstyp)");
      return;
    }
    setTypeForm({});
    load();
  };

  const saveFormat = async () => {
    if (!fmtForm.name?.trim()) return;
    const res = await fetch("/api/admin/course-formats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fmtForm, id: fmtForm.id ?? uuid() }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Speichern fehlgeschlagen (Format)");
      return;
    }
    setFmtForm({});
    load();
  };

  const saveLanguage = async () => {
    if (!langForm.name?.trim()) return;
    const res = await fetch("/api/admin/course-languages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...langForm, id: langForm.id ?? uuid() }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Speichern fehlgeschlagen (Sprache)");
      return;
    }
    setLangForm({});
    load();
  };

  const remove = async (endpoint: string, id: string) => {
    if (!id || id === "undefined") {
      setError("Löschen nicht möglich: Datensatz hat keine ID (bitte neu anlegen).");
      return;
    }
    if (!confirm("Wirklich löschen?")) return;
    const res = await fetch(`/api/admin/${endpoint}/${id}`, { method: "DELETE", headers: { "x-id": id } });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Löschen fehlgeschlagen");
      return;
    }
    load();
  };

  return (
    <div className="px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-2">
          <p className="tag">Admin</p>
          <h1 className="text-2xl font-semibold text-slate-900">Stammdaten</h1>
          <p className="text-sm text-slate-500">Kategorien, Kurstyp, Format, Sprache verwalten.</p>
        </div>

        <div className="flex gap-2 text-xs font-semibold flex-wrap">
          {[
            { id: "categories", label: "Kategorie" },
            { id: "types", label: "Kurstyp" },
            { id: "formats", label: "Format" },
            { id: "languages", label: "Sprache" },
          ].map((t) => (
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

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {loading && <div className="text-sm text-slate-500">Lade…</div>}

        {tab === "categories" && (
          <TwoCol
            titleLeft="Neue Kategorie / Unterkategorie"
            form={
              <div className="space-y-3">
                <Input label="Name" value={catForm.name ?? ""} onChange={(v) => setCatForm((p) => ({ ...p, name: v }))} />
                <Select
                  label="Child of (optional)"
                  value={catForm.parent_id ?? ""}
                  onChange={(v) => setCatForm((p) => ({ ...p, parent_id: v || null }))}
                  options={[{ value: "", label: "Keine (Top-Level)" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                />
                <div className="flex gap-2">
                  <button onClick={saveCategory} className="rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-black shadow-md shadow-[#ff1f8f]/30">
                    Speichern
                  </button>
                  {catForm.id && (
                    <button onClick={() => setCatForm({})} className="text-sm text-slate-600 underline underline-offset-4">
                      Neu anfangen
                    </button>
                  )}
                </div>
              </div>
            }
            list={
              <List
                items={categories}
                onEdit={(i) => setCatForm(i)}
                onDelete={(id) => remove("course-categories", id)}
                label={(i) => i.name + (i.parent_id ? " (Child)" : "")}
              />
            }
          />
        )}

        {tab === "types" && (
          <TwoCol
            titleLeft="Neuer Kurstyp"
            form={
              <div className="space-y-3">
                <Input label="Kurstyp" value={typeForm.name ?? ""} onChange={(v) => setTypeForm((p) => ({ ...p, name: v }))} />
                <div className="flex gap-2">
                  <button onClick={saveType} className="rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-black shadow-md shadow-[#ff1f8f]/30">
                    Speichern
                  </button>
                  {typeForm.id && (
                    <button onClick={() => setTypeForm({})} className="text-sm text-slate-600 underline underline-offset-4">
                      Neu anfangen
                    </button>
                  )}
                </div>
              </div>
            }
            list={<List items={types} onEdit={(i) => setTypeForm(i)} onDelete={(id) => remove("course-types", id)} label={(i) => i.name} />}
          />
        )}

        {tab === "formats" && (
          <TwoCol
            titleLeft="Neues Format"
            form={
              <div className="space-y-3">
                <Input label="Format" value={fmtForm.name ?? ""} onChange={(v) => setFmtForm((p) => ({ ...p, name: v }))} />
                <div className="flex gap-2">
                  <button onClick={saveFormat} className="rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-black shadow-md shadow-[#ff1f8f]/30">
                    Speichern
                  </button>
                  {fmtForm.id && (
                    <button onClick={() => setFmtForm({})} className="text-sm text-slate-600 underline underline-offset-4">
                      Neu anfangen
                    </button>
                  )}
                </div>
              </div>
            }
            list={<List items={formats} onEdit={(i) => setFmtForm(i)} onDelete={(id) => remove("course-formats", id)} label={(i) => i.name} />}
          />
        )}

        {tab === "languages" && (
          <TwoCol
            titleLeft="Neue Sprache"
            form={
              <div className="space-y-3">
                <Input label="Sprache" value={langForm.name ?? ""} onChange={(v) => setLangForm((p) => ({ ...p, name: v }))} />
                <div className="flex gap-2">
                  <button onClick={saveLanguage} className="rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-black shadow-md shadow-[#ff1f8f]/30">
                    Speichern
                  </button>
                  {langForm.id && (
                    <button onClick={() => setLangForm({})} className="text-sm text-slate-600 underline underline-offset-4">
                      Neu anfangen
                    </button>
                  )}
                </div>
              </div>
            }
            list={<List items={languages} onEdit={(i) => setLangForm(i)} onDelete={(id) => remove("course-languages", id)} label={(i) => i.name} />}
          />
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="space-y-1 text-sm block">
      <span className="text-slate-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#ff1f8f] focus:outline-none"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="space-y-1 text-sm block">
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

function TwoCol({ titleLeft, form, list }: { titleLeft: string; form: React.ReactNode; list: React.ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">{titleLeft}</h3>
        {form}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
        <h3 className="text-sm font-semibold text-slate-800">Bestehende Einträge</h3>
        {list}
      </div>
    </div>
  );
}

function List<T extends { id: string; name: string }>({
  items,
  onEdit,
  onDelete,
  label,
}: {
  items: T[];
  onEdit: (i: T) => void;
  onDelete: (id: string) => void;
  label: (i: T) => string;
}) {
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">{label(i)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(i)} className="text-xs font-semibold text-[#ff1f8f] hover:underline">
              Bearbeiten
            </button>
            <button
              onClick={() => onDelete(i.id)}
              disabled={!i.id}
              className="text-xs font-semibold text-red-500 hover:underline disabled:text-slate-400 disabled:hover:no-underline"
            >
              Löschen
            </button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-slate-500">Noch keine Einträge.</p>}
    </div>
  );
}
