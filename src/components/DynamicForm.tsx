"use client";

import { useEffect, useMemo, useState } from "react";

type FieldType = "text" | "textarea" | "select" | "radio" | "checkbox" | "multiselect" | "heading" | "subheading";

type FormField = {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  sort_order?: number;
  width?: "third" | "half" | "full";
};

type FormModel = {
  id: string;
  title: string;
  description?: string;
  require_terms?: boolean;
  terms_url?: string;
  form_fields: FormField[];
};

const FALLBACK_FORM_ID = "a6b28590-9885-42e8-a460-9ffd27b59ae3";

export default function DynamicForm() {
  const [form, setForm] = useState<FormModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [values, setValues] = useState<Record<string, string | string[] | boolean>>({});

  useEffect(() => {
    const effectiveId = FALLBACK_FORM_ID;
    console.info("[DynamicForm] loading form", effectiveId);
    const load = async () => {
      setLoading(true);
      const res = await fetch(`/api/forms/${effectiveId}`);
      const json = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(json.error || "Formular konnte nicht geladen werden");
        return;
      }
      const loaded = json.data;
      if (!loaded?.id) {
        setError("Form ID missing");
        return;
      }
      setForm(loaded);
    };
    load();
  }, []);

  const sortedFields = useMemo(() => {
    return (form?.form_fields ?? []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [form]);

  const normalizeOptions = (opts?: string[]) => {
    if (!opts || opts.length === 0) return [];
    if (opts.length === 1) {
      const only = opts[0];
      if (typeof only === "string") {
        const parts = only
          .split(/[.,;|]/)
          .map((p) => p.trim())
          .filter(Boolean);
        if (parts.length > 1) return parts;
      }
    }
    return opts;
  };

  const handleChange = (field: FormField, value: string | string[] | boolean) => {
    setValues((prev) => ({ ...prev, [field.id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !form.id) {
      setError("Formular konnte nicht geladen werden (ID fehlt)");
      return;
    }
    if (form.require_terms && !acceptTerms) {
      setError("Bitte AGB akzeptieren");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const answers = sortedFields.map((f) => {
      const v = values[f.id];
      if (f.type === "multiselect") {
        return { field_id: f.id, value_multi: Array.isArray(v) ? v : v ? [v] : [] };
      }
      if (f.type === "checkbox") {
        return { field_id: f.id, value: v ? "true" : "false" };
      }
      return { field_id: f.id, value: v ?? "" };
    });

    const res = await fetch(`/api/forms/${form.id ?? FALLBACK_FORM_ID}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, accept_terms: acceptTerms }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error || "Absenden fehlgeschlagen");
      return;
    }
    setSuccess(true);
    setValues({});
    setAcceptTerms(false);
  };

  if (loading) return <p className="text-sm text-slate-600">Lade Formular…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!form) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <p className="text-xl font-anton text-slate-900">{form.title}</p>
        {form.description && <p className="text-sm text-slate-600">{form.description}</p>}
      </div>

      <div className="grid auto-rows-min gap-4 grid-cols-12">
        {sortedFields.map((f) => {
          const width = f.type === "heading" || f.type === "subheading" ? "full" : (f.width ?? "half");
          const wrapperClass =
            f.type === "heading" || f.type === "subheading"
              ? "col-span-12"
              : width === "full"
                ? "col-span-12"
                : width === "half"
                  ? "col-span-6"
                  : "col-span-4"; // third

          const baseField = (
            <>
              <span className="text-sm font-semibold text-slate-800">
                {f.label}
                {f.required ? " *" : ""}
              </span>
              {f.type === "text" && (
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                  placeholder={f.placeholder ?? ""}
                  required={!!f.required}
                  value={values[f.id] ?? ""}
                  onChange={(e) => handleChange(f, e.target.value)}
                />
              )}
              {f.type === "textarea" && (
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                  placeholder={f.placeholder ?? ""}
                  rows={3}
                  required={!!f.required}
                  value={values[f.id] ?? ""}
                  onChange={(e) => handleChange(f, e.target.value)}
                />
              )}
              {(f.type === "select" || f.type === "multiselect") && (
                <select
                  multiple={f.type === "multiselect"}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                  required={!!f.required}
                  value={values[f.id] ?? (f.type === "multiselect" ? [] : "")}
                  onChange={(e) =>
                    handleChange(
                      f,
                      f.type === "multiselect"
                        ? Array.from(e.target.selectedOptions).map((o) => o.value)
                        : e.target.value
                    )
                  }
                >
                  <option value="" disabled={!f.required}>
                    {f.placeholder || "Bitte wählen"}
                  </option>
                  {normalizeOptions(f.options).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
              {f.type === "radio" && (
                <div className="space-y-1">
                  {(f.options ?? []).map((o) => (
                    <label key={o} className="flex items-center gap-2 text-sm text-slate-800">
                      <input
                        type="radio"
                        name={f.id}
                        value={o}
                        required={!!f.required}
                        checked={values[f.id] === o}
                        onChange={() => handleChange(f, o)}
                      />
                      {o}
                    </label>
                  ))}
                </div>
              )}
              {f.type === "checkbox" && (
                <label className="flex items-center gap-2 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    checked={!!values[f.id]}
                    onChange={(e) => handleChange(f, e.target.checked)}
                    required={!!f.required}
                  />
                  {f.placeholder || "Auswahl"}
                </label>
              )}
            </>
          );

          if (f.type === "heading" || f.type === "subheading") {
            return (
              <div key={f.id} className="space-y-1 col-span-12 w-full">
                <p className={`font-anton ${f.type === "heading" ? "text-2xl" : "text-xl"} text-slate-900`}>{f.label}</p>
              </div>
            );
          }

          return (
            <div key={f.id} className={`space-y-2 ${wrapperClass}`}>
              {baseField}
            </div>
          );
        })}
      </div>

      {form.require_terms && (
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
          <span>
            AGB akzeptieren{" "}
            {form.terms_url && (
              <a className="underline text-[#ff1f8f]" href={form.terms_url} target="_blank" rel="noreferrer">
                Link
              </a>
            )}
          </span>
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Danke, Formular wurde gesendet.</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-full bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-white shadow shadow-[#ff1f8f]/30 hover:bg-[#e40073] transition disabled:opacity-60"
      >
        {submitting ? "Senden…" : "Absenden"}
      </button>
    </form>
  );
}
