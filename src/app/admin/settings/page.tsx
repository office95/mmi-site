"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Setting = {
  key: string;
  value: string | null;
};

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

  return (
    <div className="px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="tag">Admin</p>
          <h1 className="text-2xl font-semibold text-slate-900">Verwaltung</h1>
          <p className="text-sm text-slate-500">Globale Einstellungen für die Website.</p>
        </div>

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
    </div>
  );
}
