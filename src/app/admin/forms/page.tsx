"use client";

import { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";

type FieldType = "text" | "textarea" | "select" | "radio" | "checkbox" | "multiselect" | "heading" | "subheading";

type FormField = {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  sort_order?: number;
  placeholder?: string;
  width?: "third" | "half" | "full";
};

type FormModel = {
  id: string;
  title: string;
  description?: string;
  require_terms?: boolean;
  terms_url?: string;
  is_live?: boolean;
  form_fields: FormField[];
  updated_at?: string;
};

type Submission = {
  id: string;
  created_at: string;
  answers: { label: string; value: string | string[] | null; type: string }[];
};

const emptyForm: FormModel = {
  id: "",
  title: "",
  description: "",
  require_terms: false,
  terms_url: "",
  is_live: false,
  form_fields: [],
};

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: "heading", label: "Zwischenüberschrift" },
  { value: "subheading", label: "Zwischenüberschrift klein" },
  { value: "text", label: "Textfeld" },
  { value: "textarea", label: "Langtext" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox (einzeln)" },
  { value: "multiselect", label: "Mehrfachauswahl" },
];

export default function FormsPage() {
  const [forms, setForms] = useState<FormModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FormModel | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [showSubsFor, setShowSubsFor] = useState<string | null>(null);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [allSubs, setAllSubs] = useState<Submission[]>([]);
  const [loadingAllSubs, setLoadingAllSubs] = useState(false);

  const loadForms = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/forms");
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Konnte Formulare nicht laden");
      return;
    }
    setForms(json.data ?? []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadForms();
  }, []);

  const startNew = () => {
    setEditing({ ...emptyForm, id: uuid() });
  };

  const saveForm = async () => {
    if (!editing) return;
    setSaving(true);
    const payload = { ...editing, fields: editing.form_fields };
    const res = await fetch("/api/admin/forms", { method: "POST", body: JSON.stringify(payload) });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error || "Speichern fehlgeschlagen");
      return;
    }
    setEditing(null);
    loadForms();
  };

  const deleteForm = async (id: string) => {
    if (!confirm("Formular löschen?")) return;
    const res = await fetch("/api/admin/forms", { method: "DELETE", body: JSON.stringify({ id }) });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error || "Löschen fehlgeschlagen");
    }
    loadForms();
  };

  const addField = () => {
    if (!editing) return;
    const next: FormField = { id: uuid(), label: "Neues Feld", type: "text", sort_order: editing.form_fields.length };
    setEditing({ ...editing, form_fields: [...editing.form_fields, next] });
  };

  const loadSubmissions = async (formId: string) => {
    setLoadingSubs(true);
    const res = await fetch(`/api/admin/forms/submissions?formId=${formId}`);
    const json = await res.json();
    setLoadingSubs(false);
    if (!res.ok) {
      setError(json.error || "Konnte Einreichungen nicht laden");
      return;
    }
      setSubs(json.data ?? []);
    setShowSubsFor(formId);
  };

  const loadAllSubmissions = async () => {
    setLoadingAllSubs(true);
    const res = await fetch("/api/admin/forms/submissions-all");
    const json = await res.json();
    setLoadingAllSubs(false);
    if (!res.ok) {
      setError(json.error || "Konnte Einreichungen nicht laden");
      return;
    }
    setAllSubs(json.data ?? []);
  };

  useEffect(() => {
    loadAllSubmissions();
  }, []);

  const updateField = (id: string, patch: Partial<FormField>) => {
    if (!editing) return;
    setEditing({
      ...editing,
      form_fields: editing.form_fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };

  const removeField = (id: string) => {
    if (!editing) return;
    setEditing({ ...editing, form_fields: editing.form_fields.filter((f) => f.id !== id) });
  };

  const reorderField = (fromId: string, toId: string) => {
    if (!editing || fromId === toId) return;
    const list = editing.form_fields.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const fromIndex = list.findIndex((f) => f.id === fromId);
    const toIndex = list.findIndex((f) => f.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    const reSort = list.map((f, i) => ({ ...f, sort_order: i }));
    setEditing({ ...editing, form_fields: reSort });
  };

  const sortedForms = useMemo(
    () => forms.sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? "")),
    [forms]
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 px-6 sm:px-10 lg:px-16 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin</p>
          <h1 className="font-anton text-4xl">Formulare</h1>
        </div>
        <button
          onClick={startNew}
          className="rounded-full bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-white shadow shadow-[#ff1f8f]/30 hover:bg-[#e40073] transition"
        >
          Neues Formular
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
      {loading && <p className="text-sm text-slate-600">Lade Formulare…</p>}

      {!editing && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedForms.map((f) => (
            <div key={f.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{f.is_live ? "Live" : "Entwurf"}</p>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-slate-600 line-clamp-2">{f.description}</p>
              <p className="text-xs text-slate-500">{f.form_fields?.length ?? 0} Felder</p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditing(f)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => loadSubmissions(f.id)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Antworten
                </button>
                <button
                  onClick={() => deleteForm(f.id)}
                  className="rounded-full border border-red-200 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!editing && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-anton text-2xl">Alle Einreichungen</h2>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                Archivierte anzeigen
              </label>
              {loadingAllSubs && <p className="text-xs text-slate-500">Lade…</p>}
            </div>
          </div>
          <div className="overflow-auto max-h-[60vh]">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 pr-3">Datum</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">E-Mail</th>
                  <th className="py-2 pr-3">Formular</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allSubs
                  .filter((s) => (showArchived ? true : !s.archived))
                  .map((s) => {
                    const name = s.answers.find((a) => a.label?.toLowerCase().includes("vorname"))?.value ?? "";
                    const email = s.answers.find((a) => a.label?.toLowerCase().includes("email"))?.value ?? "";
                    const formTitle = forms.find((f) => f.id === s.form_id)?.title ?? s.form_id;
                    return (
                      <tr key={s.id} className="align-middle">
                        <td className="py-2 pr-3 text-xs text-slate-600">{new Date(s.created_at).toLocaleString()}</td>
                        <td className="py-2 pr-3">{name || "—"}</td>
                        <td className="py-2 pr-3">{email || "—"}</td>
                        <td className="py-2 pr-3 text-xs text-slate-600">{formTitle}</td>
                        <td className="py-2 pr-3 text-xs">{s.archived ? "Archiviert" : "Neu"}</td>
                        <td className="py-2 pr-0 text-right space-x-2">
                          <button
                            onClick={() => loadSubmissions(s.form_id)}
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            Details
                          </button>
                          <button
                            onClick={async () => {
                              await fetch("/api/admin/forms/submissions", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: s.id, archived: !s.archived }),
                              });
                              await loadAllSubmissions();
                            }}
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            {s.archived ? "Wiederherstellen" : "Archivieren"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {allSubs.filter((s) => (showArchived ? true : !s.archived)).length === 0 && (
              <p className="text-sm text-slate-600 py-3">Keine Einreichungen gefunden.</p>
            )}
          </div>
        </div>
      )}

      {editing && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-6 space-y-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="font-anton text-2xl">Formular bearbeiten</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(null)}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                onClick={saveForm}
                disabled={saving}
                className="rounded-full bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-white shadow shadow-[#ff1f8f]/30 hover:bg-[#e40073] transition disabled:opacity-60"
              >
                {saving ? "Speichern…" : "Speichern"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-semibold">Formular Titel</span>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-semibold">Beschreibung</span>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-semibold">AGB-Link (optional)</span>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                value={editing.terms_url ?? ""}
                onChange={(e) => setEditing({ ...editing, terms_url: e.target.value })}
              />
            </label>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={!!editing.require_terms}
                  onChange={(e) => setEditing({ ...editing, require_terms: e.target.checked })}
                />
                AGB erforderlich
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={!!editing.is_live}
                  onChange={(e) => setEditing({ ...editing, is_live: e.target.checked })}
                />
                Live schalten
              </label>
            </div>
          </div>

              <div className="grid gap-y-4 gap-x-4">
            <div className="flex items-center justify-between">
              <h3 className="font-anton text-xl">Felder</h3>
              <button
                onClick={addField}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Feld hinzufügen
              </button>
            </div>
            <div className="space-y-3">
              {editing.form_fields
                .slice()
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                .map((f, idx, arr) => (
                <div
                  key={f.id}
                  draggable
                  onDragStart={() => setDragId(f.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragId && dragId !== f.id) reorderField(dragId, f.id);
                  }}
                  onDragEnd={() => setDragId(null)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-2 cursor-move"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2"
                      value={f.label}
                      onChange={(e) => updateField(f.id, { label: e.target.value })}
                    />
                    <select
                      className="rounded-lg border border-slate-200 px-3 py-2"
                      value={f.type}
                      onChange={(e) => updateField(f.id, { type: e.target.value as FieldType })}
                    >
                      {fieldTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {!(f.type === "heading" || f.type === "subheading") && (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!f.required}
                          onChange={(e) => updateField(f.id, { required: e.target.checked })}
                        />
                        Pflicht
                      </label>
                    )}
                    <button
                      onClick={() => removeField(f.id)}
                      className="rounded-full border border-red-200 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      Entfernen
                    </button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {!(f.type === "heading" || f.type === "subheading") && (
                      <input
                        className="rounded-lg border border-slate-200 px-3 py-2"
                        placeholder="Platzhalter (optional)"
                        value={f.placeholder ?? ""}
                        onChange={(e) => updateField(f.id, { placeholder: e.target.value })}
                      />
                    )}
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2"
                      placeholder="Sortierung"
                      type="number"
                      value={f.sort_order ?? idx}
                      onChange={(e) => updateField(f.id, { sort_order: Number(e.target.value) })}
                    />
                    {!(f.type === "heading" || f.type === "subheading") && (
                      <select
                        className="rounded-lg border border-slate-200 px-3 py-2"
                        value={f.width ?? "half"}
                        onChange={(e) => updateField(f.id, { width: e.target.value as "third" | "half" | "full" })}
                      >
                        <option value="third">Drittel</option>
                        <option value="half">Halbe Breite</option>
                        <option value="full">Volle Breite</option>
                      </select>
                    )}
                  </div>
                  {(f.type === "select" || f.type === "radio" || f.type === "multiselect") && (
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2"
                      placeholder="Optionen kommasepariert"
                      value={(f.options ?? []).join(", ")}
                      onChange={(e) => updateField(f.id, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                    />
                  )}
                </div>
              ))}
              {editing.form_fields.length === 0 && <p className="text-sm text-slate-500">Noch keine Felder hinzugefügt.</p>}
            </div>
            <div className="flex justify-end">
              <button
                onClick={addField}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Feld hinzufügen
              </button>
            </div>
          </div>

          {/* Vorschau */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-anton text-xl">Vorschau</h3>
              <p className="text-xs text-slate-500">Live-Rendering der Felder</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-900">{editing.title || "Formular Titel"}</p>
                {editing.description && <p className="text-sm text-slate-600">{editing.description}</p>}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {editing.form_fields
                  .slice()
                  .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                  .map((f) => {
                    const isFull = f.width === "full";
                    const isThird = f.width === "third";

                    const spanClasses =
                      f.type === "heading" || f.type === "subheading"
                        ? "md:col-span-2 lg:col-span-3"
                        : isFull
                          ? "md:col-span-2 lg:col-span-3"
                          : isThird
                            ? "md:col-span-1 lg:col-span-1"
                            : "md:col-span-1 lg:col-span-2";

                    return (
                      <div key={f.id} className={`space-y-1 text-sm text-slate-700 col-span-1 ${spanClasses}`}>
                        {f.type === "heading" ? (
                          <p className="font-anton text-2xl text-slate-900">{f.label}</p>
                        ) : f.type === "subheading" ? (
                          <p className="font-anton text-xl text-slate-800">{f.label}</p>
                        ) : (
                          <>
                            <span className="font-semibold">
                              {f.label}
                              {f.required ? " *" : ""}
                            </span>
                            {f.type === "text" && (
                              <input
                                disabled
                                placeholder={f.placeholder ?? ""}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800"
                              />
                            )}
                            {f.type === "textarea" && (
                              <textarea
                                disabled
                                placeholder={f.placeholder ?? ""}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800"
                                rows={3}
                              />
                            )}
                            {(f.type === "select" || f.type === "multiselect") && (
                              <select
                                disabled
                                multiple={f.type === "multiselect"}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800"
                              >
                                {(f.options ?? []).map((o) => (
                                  <option key={o}>{o}</option>
                                ))}
                              </select>
                            )}
                            {f.type === "radio" && (
                              <div className="space-y-1">
                                {(f.options ?? []).map((o) => (
                                  <label key={o} className="flex items-center gap-2">
                                    <input type="radio" disabled />
                                    <span>{o}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            {f.type === "checkbox" && (
                              <label className="flex items-center gap-2">
                                <input type="checkbox" disabled />
                                <span>{f.placeholder || "Auswahl"}</span>
                              </label>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
              {editing.require_terms && (
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" disabled />
                  <span>
                    AGB akzeptieren {editing.terms_url && (<a className="underline text-[#ff1f8f]" href={editing.terms_url}>Link</a>)}
                  </span>
                </label>
              )}
              <button
                disabled
                className="inline-flex items-center justify-center rounded-full bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-white opacity-80"
              >
                Absenden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubsFor && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Formular</p>
                <h3 className="font-anton text-2xl">Einreichungen</h3>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                  />
                  Archivierte anzeigen
                </label>
                <button
                  onClick={() => {
                    setShowSubsFor(null);
                    setSubs([]);
                  }}
                  className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                >
                  Schließen
                </button>
              </div>
            </div>
            {loadingSubs && <p className="text-sm text-slate-600">Lade…</p>}
            {!loadingSubs && subs.length === 0 && <p className="text-sm text-slate-600">Keine Einreichungen.</p>}
            <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
              {subs
                .filter((s) => (showArchived ? true : !s.archived))
                .map((s) => (
                <div key={s.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">Eingegangen: {new Date(s.created_at).toLocaleString()}</p>
                    <button
                      className="text-xs font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900"
                      onClick={async () => {
                        await fetch("/api/admin/forms/submissions", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: s.id, archived: !s.archived }),
                        });
                        await loadSubmissions(showSubsFor!);
                      }}
                    >
                      {s.archived ? "Aus Archiv holen" : "Archivieren"}
                    </button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {s.answers.map((a, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <p className="text-[12px] font-semibold text-slate-600">{a.label || "Feld"}</p>
                        <p className="text-sm text-slate-900 break-words">
                          {Array.isArray(a.value) ? a.value.join(", ") : String(a.value ?? "")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
