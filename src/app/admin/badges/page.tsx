"use client";

import { useEffect, useState } from "react";

type Badge = {
  id: string;
  name: string;
  slug: string;
  scope: "course" | "partner" | "both";
  color: string;
  icon: string | null;
  auto_type: string | null;
};

const scopes = [
  { value: "course", label: "Kurs" },
  { value: "partner", label: "Partner" },
  { value: "both", label: "Beides" },
];

export default function AdminBadgesPage() {
  const [rows, setRows] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Badge>>({ scope: "course", color: "#ff1f8f" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/badges", { cache: "no-store" });
    const json = await res.json();
    setRows(json?.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({ scope: "course", color: "#ff1f8f" });
    setEditingId(null);
  };

  const save = async () => {
    if (!form.name || !form.slug || !form.scope) return alert("Name, Slug und Scope sind Pflicht.");
    const payload = { ...form };
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...payload, id: editingId } : payload;
    const res = await fetch("/api/admin/badges", { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
    const json = await res.json();
    if (res.ok) {
      await load();
      resetForm();
    } else {
      alert(json?.error || "Fehler beim Speichern");
    }
  };

  const del = async (id: string) => {
    if (!confirm("Badge wirklich löschen?")) return;
    const res = await fetch(`/api/admin/badges?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      await load();
    } else {
      alert("Löschen fehlgeschlagen");
    }
  };

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.slug.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Admin</p>
            <h1 className="font-anton text-3xl text-slate-900">Badges verwalten</h1>
            <p className="text-sm text-slate-600">Steuere wenige, klare Badges für Kurse und Partner.</p>
          </div>
          <button
            onClick={resetForm}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Neu
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suche nach Name oder Slug"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          {/* Liste */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="px-4 py-6 text-center text-slate-500">Lade Badges…</div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-slate-500">Keine Badges gefunden.</div>
              ) : (
                filtered.map((b) => (
                  <div key={b.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: b.color }}
                      >
                        {b.name}
                      </span>
                      <div className="text-xs text-slate-500">
                        <div>{b.slug}</div>
                        <div className="font-semibold text-slate-700">{scopeLabel(b.scope)}</div>
                        {b.auto_type && <div className="text-[11px] text-slate-500">Auto: {b.auto_type}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingId(b.id);
                          setForm(b);
                        }}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => del(b.id)}
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Formular */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{editingId ? "Badge bearbeiten" : "Neuer Badge"}</p>
              <h2 className="text-lg font-semibold text-slate-900">{editingId ? form.name : "Badge anlegen"}</h2>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-800">
                Name
                <input
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-800">
                Slug
                <input
                  value={form.slug ?? ""}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="z.B. intensiv, neu, fast-ausgebucht"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-800">
                Scope
                <select
                  value={form.scope ?? "course"}
                  onChange={(e) => setForm({ ...form, scope: e.target.value as Badge["scope"] })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                >
                  {scopes.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-800">
                Farbe
                <input
                  type="color"
                  value={form.color ?? "#ff1f8f"}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-2 py-1"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-800">
                Icon (optional)
                <input
                  value={form.icon ?? ""}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="z.B. sparkles, star"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-800">
                Auto-Typ (optional)
                <input
                  value={form.auto_type ?? ""}
                  onChange={(e) => setForm({ ...form, auto_type: e.target.value })}
                  placeholder="z.B. type:intensiv, seats:<=2, age:60d, metric:hot"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={save}
                className="rounded-full bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-pink-400/30 hover:-translate-y-0.5 transition"
              >
                {editingId ? "Speichern" : "Anlegen"}
              </button>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Abbrechen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function scopeLabel(scope: Badge["scope"]) {
  if (scope === "course") return "Kurs";
  if (scope === "partner") return "Partner";
  return "Beides";
}
