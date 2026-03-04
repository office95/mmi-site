"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Setting = { key: string; value: string | null };
type Faq = { id: number; question: string; answer: string; region: string | null; sort: number | null };

const LOGO_KEY = "site_logo_url";
const AGB_KEY = "pdf_agb_url";
const DATENSCHUTZ_KEY = "pdf_datenschutz_url";

export default function SettingsPage() {
  const supabase = getSupabaseBrowserClient();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [agbUrl, setAgbUrl] = useState<string | null>(null);
  const [dsUrl, setDsUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [tab, setTab] = useState<"settings" | "faqs">("settings");

  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);
  const [faqForm, setFaqForm] = useState<{ id?: number; question: string; answer: string; region: string; sort: string }>({
    question: "",
    answer: "",
    region: "",
    sort: "",
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("settings").select("key,value").in("key", [LOGO_KEY, AGB_KEY, DATENSCHUTZ_KEY]);
      data?.forEach((row) => {
        if (row.key === LOGO_KEY) setLogoUrl(row.value as string);
        if (row.key === AGB_KEY) setAgbUrl(row.value as string);
        if (row.key === DATENSCHUTZ_KEY) setDsUrl(row.value as string);
      });
    };
    load();
  }, [supabase]);

  const loadFaqs = async () => {
    setLoadingFaqs(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/homepage-faqs");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fehler beim Laden der FAQs");
      setFaqs(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Laden der FAQs");
    } finally {
      setLoadingFaqs(false);
    }
  };

  useEffect(() => {
    if (tab === "faqs" && faqs.length === 0 && !loadingFaqs) {
      loadFaqs();
    }
  }, [tab, faqs.length, loadingFaqs]);

  const uploadLogo = async (file: File) => {
    setUploading(true);
    setError(null);
    setInfo(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", "site-header-logo");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen");
      setLogoUrl(data.url);
      setInfo("Logo hochgeladen. Speichern, um es zu übernehmen.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const uploadPdf = async (file: File, setter: (v: string) => void) => {
    setUploading(true);
    setError(null);
    setInfo(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", file.name);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen");
      setter(data.url);
      setInfo("PDF hochgeladen. Speichern, um es zu übernehmen.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setInfo(null);
    const rows = [
      logoUrl ? { key: LOGO_KEY, value: logoUrl } : null,
      agbUrl ? { key: AGB_KEY, value: agbUrl } : null,
      dsUrl ? { key: DATENSCHUTZ_KEY, value: dsUrl } : null,
    ].filter(Boolean);

    const { error } = await supabase.from("settings").upsert(rows as any[], { onConflict: "key" });
    if (error) setError(error.message);
    else setInfo("Gespeichert.");
    setSaving(false);
  };

  const resetFaqForm = () => setFaqForm({ id: undefined, question: "", answer: "", region: "", sort: "" });

  const saveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      setError("Frage und Antwort dürfen nicht leer sein.");
      return;
    }
    setSavingFaq(true);
    setError(null);
    setInfo(null);
    const payload = {
      id: faqForm.id,
      question: faqForm.question.trim(),
      answer: faqForm.answer.trim(),
      region: faqForm.region || null,
      sort: faqForm.sort ? Number(faqForm.sort) : null,
    };
    try {
      const res = await fetch("/api/admin/homepage-faqs", {
        method: payload.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fehler beim Speichern");
      setInfo("FAQ gespeichert.");
      resetFaqForm();
      await loadFaqs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Speichern");
    } finally {
      setSavingFaq(false);
    }
  };

  const editFaq = (f: Faq) => {
    setFaqForm({
      id: f.id,
      question: f.question,
      answer: f.answer,
      region: f.region || "",
      sort: f.sort?.toString() ?? "",
    });
    setTab("faqs");
  };

  const deleteFaq = async (id: number) => {
    if (!confirm("FAQ wirklich löschen?")) return;
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/admin/homepage-faqs?id=${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Fehler beim Löschen");
      setInfo("FAQ gelöscht.");
      await loadFaqs();
      if (faqForm.id === id) resetFaqForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Löschen");
    }
  };

  const sortedFaqs = useMemo(
    () => [...faqs].sort((a, b) => (a.sort ?? 9999) - (b.sort ?? 9999)),
    [faqs]
  );

  return (
    <div className="px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="tag">Admin</p>
          <h1 className="text-2xl font-semibold text-slate-900">Verwaltung</h1>
          <p className="text-sm text-slate-500">Globale Einstellungen & FAQs für die Startseite.</p>
        </div>

        <div className="flex gap-2">
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "settings" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"
            }`}
            onClick={() => setTab("settings")}
          >
            Einstellungen
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "faqs" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"
            }`}
            onClick={() => setTab("faqs")}
          >
            FAQs Startseite
          </button>
        </div>

        {tab === "settings" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Header-Logo</h2>
              <p className="text-sm text-slate-600">Hier kannst du das Logo für den Website-Header hochladen.</p>

              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} className="text-sm" />
                {uploading && <span className="text-xs text-slate-500">Upload…</span>}
              </div>

              {logoUrl && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Header Logo" className="h-24 w-full object-contain" />
                  <p className="text-[11px] text-slate-500 px-2 py-1 break-all">{logoUrl}</p>
                </div>
              )}

              {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              {info && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</div>}

              <div className="flex items-center gap-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-black shadow-md shadow-[#ff1f8f]/30 hover:bg-[#e40073] disabled:opacity-60"
                >
                  {saving ? "Speichern…" : "Speichern"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Rechtliche Dokumente</h2>
              <p className="text-sm text-slate-600">PDFs für AGB und Datenschutz hochladen.</p>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-800">AGB (PDF)</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && uploadPdf(e.target.files[0], setAgbUrl)} className="text-sm" />
                  {uploading && <span className="text-xs text-slate-500">Upload…</span>}
                </div>
                {agbUrl && (
                  <a href={agbUrl} target="_blank" rel="noreferrer" className="text-xs text-pink-600 underline break-all">
                    {agbUrl}
                  </a>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-800">Datenschutz (PDF)</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && uploadPdf(e.target.files[0], setDsUrl)} className="text-sm" />
                  {uploading && <span className="text-xs text-slate-500">Upload…</span>}
                </div>
                {dsUrl && (
                  <a href={dsUrl} target="_blank" rel="noreferrer" className="text-xs text-pink-600 underline break-all">
                    {dsUrl}
                  </a>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-black shadow-md shadow-[#ff1f8f]/30 hover:bg-[#e40073] disabled:opacity-60"
                >
                  {saving ? "Speichern…" : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "faqs" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">FAQ bearbeiten</h2>
              <div className="grid gap-3">
                <div className="grid gap-1">
                  <label className="text-sm font-semibold text-slate-800">Frage</label>
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm((f) => ({ ...f, question: e.target.value }))}
                    placeholder="Frage"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-semibold text-slate-800">Antwort</label>
                  <textarea
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[80px]"
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm((f) => ({ ...f, answer: e.target.value }))}
                    placeholder="Antwort"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <label className="text-sm font-semibold text-slate-800">Region</label>
                    <select
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={faqForm.region}
                      onChange={(e) => setFaqForm((f) => ({ ...f, region: e.target.value }))}
                    >
                      <option value="">Alle (Standard)</option>
                      <option value="AT">AT</option>
                      <option value="DE">DE</option>
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-semibold text-slate-800">Sortierung (Zahl)</label>
                    <input
                      type="number"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={faqForm.sort}
                      onChange={(e) => setFaqForm((f) => ({ ...f, sort: e.target.value }))}
                      placeholder="z.B. 10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button onClick={saveFaq} disabled={savingFaq} className="btn-primary text-sm">
                  {savingFaq ? "Speichern…" : faqForm.id ? "FAQ aktualisieren" : "FAQ anlegen"}
                </button>
                {faqForm.id && (
                  <button onClick={resetFaqForm} className="btn-outline text-sm">
                    Neu anlegen
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Vorhandene FAQs</h2>
                <button onClick={loadFaqs} className="text-sm text-pink-600 hover:underline">
                  Neu laden
                </button>
              </div>
              {loadingFaqs ? (
                <p className="text-sm text-slate-500">Lade FAQs…</p>
              ) : sortedFaqs.length === 0 ? (
                <p className="text-sm text-slate-500">Keine FAQs angelegt.</p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {sortedFaqs.map((f) => (
                    <div key={f.id} className="py-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {f.question}{" "}
                          <span className="text-[11px] text-slate-500">
                            {f.region ? `(${f.region})` : "(alle)"} {f.sort ? `· Sort ${f.sort}` : ""}
                          </span>
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{f.answer}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-outline text-xs" onClick={() => editFaq(f)}>
                          Bearbeiten
                        </button>
                        <button className="text-xs text-red-600 hover:underline" onClick={() => deleteFaq(f.id)}>
                          Löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            {info && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
