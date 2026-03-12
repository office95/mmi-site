"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { SiteHeader } from "@/components/SiteHeader";
import { AlertTriangle, ArrowRightLeft, Check, Globe2, Loader2, Plus, Save } from "lucide-react";

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Fehler beim Laden");
  return json;
};

type DomainVariant = "at" | "de";

type SeoRow = {
  id?: string;
  page_key: string;
  slug: string;
  domain_variant: DomainVariant;
  locale: "de-AT" | "de-DE";
  title_tag: string;
  meta_description?: string | null;
  h1: string;
  hero_subline?: string | null;
  canonical_url?: string | null;
  hreflang_target_url?: string | null;
  robots_index?: boolean;
  robots_follow?: boolean;
  country_label?: string | null;
  internal_notes?: string | null;
};

const toSlug = (raw: string) => {
  if (!raw) return "/";
  let s = raw.trim();
  if (!s.startsWith("/")) s = `/${s}`;
  s = s.replace(/\s+/g, "");
  s = s.replace(/\/+$/, "");
  return s || "/";
};

const domainHost = (variant: DomainVariant) => {
  const env = variant === "de" ? process.env.NEXT_PUBLIC_DOMAIN_DE : process.env.NEXT_PUBLIC_DOMAIN_AT;
  const fallback = process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at";
  if (!env) return fallback;
  if (env.startsWith("http")) return env;
  return `https://${env}`;
};

const blankRow = (variant: DomainVariant, pageKey = ""): SeoRow => ({
  page_key: pageKey,
  slug: "/",
  domain_variant: variant,
  locale: variant === "de" ? "de-DE" : "de-AT",
  title_tag: "",
  meta_description: "",
  h1: "",
  hero_subline: "",
  canonical_url: "",
  hreflang_target_url: "",
  robots_index: true,
  robots_follow: true,
  country_label: variant === "de" ? "Deutschland" : "Österreich",
  internal_notes: "",
});

const LengthHint = ({ value, limit }: { value: string; limit: number }) => {
  const len = value?.length || 0;
  const tone = len === 0 ? "text-slate-400" : len > limit + 20 ? "text-rose-600" : len > limit ? "text-amber-600" : "text-emerald-600";
  return <span className={`text-[11px] font-semibold ${tone}`}>{len}/{limit}</span>;
};

const WarningBadge = ({ text }: { text: string }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
    <AlertTriangle size={13} /> {text}
  </span>
);

function SeoCard({
  row,
  counterpart,
  onChange,
  onSave,
  onDelete,
}: {
  row: SeoRow;
  counterpart?: SeoRow | null;
  onChange: (patch: Partial<SeoRow>) => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const warnings = useMemo(() => {
    const w: string[] = [];
    if (!counterpart) w.push("Kein Pendant in anderer Domain");
    if (!row.canonical_url) w.push("Canonical fehlt");
    if (!row.hreflang_target_url && !counterpart?.canonical_url) w.push("hreflang Alternate fehlt");
    return w;
  }, [row.canonical_url, row.hreflang_target_url, counterpart]);

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      await onSave();
    } catch (e: any) {
      setErr(e?.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const suggestion = `${domainHost(row.domain_variant)}${toSlug(row.slug || "/")}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm shadow-slate-200/70">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-black">
            {row.domain_variant.toUpperCase()}
          </span>
          <div className="leading-tight">
            <p>{row.locale}</p>
            <p className="text-[11px] text-slate-500">{row.country_label || (row.domain_variant === "de" ? "Deutschland" : "Österreich")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {warnings.map((w) => (
            <WarningBadge key={w} text={w} />
          ))}
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-700">
            <span className="flex items-center justify-between"><span>Page Key *</span></span>
            <input
              value={row.page_key}
              onChange={(e) => onChange({ page_key: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              placeholder="z.B. homepage"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span className="flex items-center justify-between"><span>Slug *</span><span className="text-[11px] text-slate-500">ohne Domain</span></span>
            <input
              value={row.slug}
              onChange={(e) => onChange({ slug: toSlug(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              placeholder="/entdecken"
            />
          </label>
        </div>

        <label className="space-y-1 text-sm text-slate-700">
          <span className="flex items-center justify-between"><span>Title Tag *</span><LengthHint value={row.title_tag} limit={60} /></span>
          <input
            value={row.title_tag}
            onChange={(e) => onChange({ title_tag: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
            placeholder="Title im Tab / SERP"
          />
        </label>

        <label className="space-y-1 text-sm text-slate-700">
          <span className="flex items-center justify-between"><span>Meta Description</span><LengthHint value={row.meta_description || ""} limit={160} /></span>
          <textarea
            value={row.meta_description || ""}
            onChange={(e) => onChange({ meta_description: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
            rows={3}
            placeholder="Kurzbeschreibung für Snippet"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-700">
            <span>H1 *</span>
            <input
              value={row.h1}
              onChange={(e) => onChange({ h1: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              placeholder="Hauptüberschrift der Seite"
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span>Hero-Subline (optional)</span>
            <input
              value={row.hero_subline || ""}
              onChange={(e) => onChange({ hero_subline: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              placeholder="Unterzeile im Hero"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-700">
            <span>Canonical URL</span>
            <input
              value={row.canonical_url || ""}
              onChange={(e) => onChange({ canonical_url: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              placeholder={suggestion}
            />
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span>hreflang Alternate URL</span>
            <input
              value={row.hreflang_target_url || ""}
              onChange={(e) => onChange({ hreflang_target_url: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              placeholder={counterpart ? `${domainHost(counterpart.domain_variant)}${counterpart.slug}` : "URL der Schwester-Seite"}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={row.robots_index ?? true}
              onChange={(e) => onChange({ robots_index: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
            />
            <span>robots: index</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={row.robots_follow ?? true}
              onChange={(e) => onChange({ robots_follow: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
            />
            <span>robots: follow</span>
          </label>
          <label className="space-y-1 text-sm text-slate-700">
            <span>Country Label</span>
            <input
              value={row.country_label || ""}
              onChange={(e) => onChange({ country_label: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              placeholder="Deutschland / Österreich"
            />
          </label>
        </div>

        <label className="space-y-1 text-sm text-slate-700">
          <span>Interne Notiz</span>
          <textarea
            value={row.internal_notes || ""}
            onChange={(e) => onChange({ internal_notes: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
            rows={2}
            placeholder="z.B. Quelle, nächste Schritte"
          />
        </label>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500 mb-2">
            <Globe2 size={14} /> Vorschau
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">{row.title_tag || "(kein Title)"}</p>
            <p className="text-slate-600">{row.meta_description || "(keine Meta Description)"}</p>
            <p className="text-[13px] text-slate-500 break-all">{row.canonical_url || suggestion}</p>
            <p className="text-[12px] text-slate-500">H1: {row.h1 || "(leer)"}</p>
            {row.hero_subline ? <p className="text-[12px] text-slate-500">Subline: {row.hero_subline}</p> : null}
          </div>
        </div>

        {err ? <p className="text-sm text-rose-600">{err}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-slate-900/15 hover:-translate-y-0.5 transition"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Speichern
          </button>
          {row.id ? (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Löschen
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function SeoMatrixPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/seo-matrix", fetcher, { revalidateOnFocus: false });
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [newKey, setNewKey] = useState("");

  useEffect(() => {
    if (data?.data) {
      setRows(data.data);
    }
  }, [data]);

  const grouped = useMemo(() => {
    const map = new Map<string, SeoRow[]>();
    rows.forEach((r) => {
      const list = map.get(r.page_key) || [];
      map.set(r.page_key, [...list.filter((l) => l.domain_variant !== r.domain_variant), r]);
    });
    return map;
  }, [rows]);

  const saveRow = async (row: SeoRow) => {
    const method = row.id ? "PATCH" : "POST";
    const res = await fetch("/api/admin/seo-matrix", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json?.error || "Speichern fehlgeschlagen");
    }
    await mutate();
  };

  const deleteRow = async (row: SeoRow) => {
    if (!row.id) {
      setRows((prev) => prev.filter((r) => r !== row));
      return;
    }
    const res = await fetch(`/api/admin/seo-matrix?id=${encodeURIComponent(row.id)}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json?.error || "Löschen fehlgeschlagen");
    }
    await mutate();
  };

  const addPair = () => {
    const key = newKey.trim();
    if (!key) return;
    setRows((prev) => [...prev, { ...blankRow("at", key), slug: key === "homepage" ? "/" : `/${key}` }, { ...blankRow("de", key), slug: key === "homepage" ? "/" : `/${key}` }]);
    setNewKey("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#fff5fb] to-[#eef2ff] text-slate-900">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Admin</p>
            <h1 className="font-anton text-3xl text-slate-900">SEO Matrix</h1>
            <p className="text-sm text-slate-600">Domain-spezifische Titles, Descriptions, H1 & hreflang für AT/DE.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Neuer page_key (z.B. homepage)"
                className="w-48 border-none text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
              />
              <button
                onClick={addPair}
                className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
              >
                <Plus size={14} /> Paar anlegen
              </button>
            </div>
          </div>
        </div>

        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error.message}</div> : null}

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Loader2 className="h-4 w-4 animate-spin" /> Lädt SEO-Einträge…
          </div>
        ) : null}

        {Array.from(grouped.entries()).map(([pageKey, group]) => {
          const sorted = [...group].sort((a, b) => a.domain_variant.localeCompare(b.domain_variant));
          const at = sorted.find((r) => r.domain_variant === "at") || null;
          const de = sorted.find((r) => r.domain_variant === "de") || null;
          return (
            <div key={pageKey || Math.random()} className="space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm shadow-slate-200/60">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Page Key</p>
                  <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    {pageKey}
                    {(at && de) ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        <Check size={13} /> AT + DE gepflegt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                        <AlertTriangle size={13} /> Pendant fehlt
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <ArrowRightLeft size={14} /> Stellen sicher: Canonical ist self-referencing, hreflang verlinkt Schwesterseite.
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {sorted.map((row) => (
                  <SeoCard
                    key={row.id || `${row.page_key}-${row.domain_variant}`}
                    row={row}
                    counterpart={row.domain_variant === "at" ? de : at}
                    onChange={(patch) => setRows((prev) => prev.map((r) => (r === row ? { ...r, ...patch } : r)))}
                    onSave={() => saveRow(row)}
                    onDelete={() => deleteRow(row)}
                  />
                ))}
                {sorted.length === 1 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 flex items-center justify-center">
                    <button
                      onClick={() => setRows((prev) => [...prev, blankRow(sorted[0].domain_variant === "at" ? "de" : "at", pageKey)])}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm border border-slate-200 hover:-translate-y-0.5 transition"
                    >
                      <Plus size={14} /> Pendant hinzufügen
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {rows.length === 0 && !isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-center text-slate-600 shadow-sm">
            Noch keine Einträge. Lege über "Paar anlegen" einen ersten page_key an.
          </div>
        ) : null}
      </div>
    </div>
  );
}
