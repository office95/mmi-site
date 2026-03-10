"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { CampaignPlanItem, GeneratedContent, MarketingStatus, Platform } from "@/lib/marketing/types";
import Image from "next/image";

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Fehler beim Laden");
  return json;
};

const statusLabel: Record<MarketingStatus, string> = {
  not_eligible: "Nicht werbefähig",
  eligible: "Werbefähig",
  generated: "Inhalt generiert",
  needs_approval: "Freigabe nötig",
  scheduled: "Geplant",
  published: "Veröffentlicht",
  paused: "Pausiert",
};

const statusTone: Record<MarketingStatus, string> = {
  not_eligible: "bg-slate-100 text-slate-700",
  eligible: "bg-blue-50 text-blue-700",
  generated: "bg-emerald-50 text-emerald-700",
  needs_approval: "bg-amber-50 text-amber-700",
  scheduled: "bg-indigo-50 text-indigo-700",
  published: "bg-slate-900 text-white",
  paused: "bg-slate-200 text-slate-700",
};

type Row = {
  campaignId?: string | null;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  image?: string | null;
  status: MarketingStatus;
  persistedStatus?: MarketingStatus | null;
  eligibility: { eligible: boolean; missing: string[] };
  session?: { id?: string | null; start_date?: string | null; start_time?: string | null; city?: string | null; state?: string | null } | null;
  sessions?: {
    id?: string | null;
    start_date?: string | null;
    start_time?: string | null;
    city?: string | null;
    state?: string | null;
    partner?: { name?: string | null; city?: string | null; state?: string | null } | null;
  }[];
  partner?: { name?: string | null; city?: string | null; state?: string | null } | null;
  plan: CampaignPlanItem[];
  template?: string | null;
  content: GeneratedContent[];
};

export default function MarketingPage() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Row[] }>("/api/admin/marketing", fetcher);
  const [statusFilter, setStatusFilter] = useState<MarketingStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);

  const rows = data?.data ?? [];

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (platformFilter !== "all") {
        const hasPlatform = r.content.some((c) => c.platform === platformFilter);
        if (!hasPlatform) return false;
      }
      if (search.trim()) {
        const hay = `${r.courseTitle} ${r.partner?.name ?? ""} ${r.courseSlug}`.toLowerCase();
        if (!hay.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, statusFilter, platformFilter, search]);

  const updateStatus = async (campaignId: string | null | undefined, status: MarketingStatus) => {
    if (!campaignId) {
      alert("Kein Kampagnen-Datensatz vorhanden (Migration noch nicht ausgeführt?).");
      return;
    }
    const res = await fetch(`/api/admin/marketing/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const json = await res.json();
      alert(json?.error || "Status konnte nicht aktualisiert werden.");
      return;
    }
    await mutate();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin</p>
            <h1 className="font-anton text-3xl">Marketing Automation</h1>
            <p className="text-sm text-slate-600">Social Media & Kampagnenplanung aus Kursdaten. Vollautomatisiert, aber mit Freigabe-Kontrolle.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Kurs oder Partner"
              className="w-full sm:w-64 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">Status: Alle</option>
              {Object.keys(statusLabel).map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s as MarketingStatus]}
                </option>
              ))}
            </select>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as any)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">Plattform: Alle</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr_120px] items-center bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            <div>Kurs</div>
            <div>Termine</div>
            <div>Partner</div>
            <div>Status</div>
            <div className="text-right">Aktionen</div>
          </div>
          <div className="divide-y divide-slate-100">
            {isLoading && <div className="px-4 py-6 text-sm text-slate-500">Lädt…</div>}
            {error && <div className="px-4 py-6 text-sm text-red-600">Fehler beim Laden.</div>}
            {!isLoading && !error && filtered.length === 0 && <div className="px-4 py-6 text-sm text-slate-500">Keine Einträge.</div>}
            {filtered.map((row) => {
              const missing = row.eligibility.missing;
              const upcoming = row.plan[0];
              return (
                <div key={row.courseId} className="px-4 py-3 grid grid-cols-[2fr_1.4fr_1fr_1fr_120px] items-start gap-3 hover:bg-slate-50">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900">{row.courseTitle}</div>
                    <div className="text-xs text-slate-500">/kurs/{row.courseSlug}</div>
                    {missing.length > 0 && (
                      <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 inline-flex gap-1">
                        Fehlende Daten: {missing.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-slate-700 space-y-1">
                    {(row.sessions && row.sessions.length > 0 ? row.sessions : row.session ? [row.session] : []).slice(0, 3).map((s, idx) => (
                      <div key={`${row.courseId}-${(s as any)?.id ?? idx}`} className="border border-slate-100 rounded-lg px-2 py-1 bg-white">
                        <div className="font-semibold">
                          {s?.start_date ?? "Termin folgt"}{s?.start_time ? ` · ${s.start_time.slice(0, 5)} Uhr` : ""}
                        </div>
                        <div className="text-xs text-slate-500">
                          {(s as any)?.city || (s as any)?.state || (s as any)?.partner?.city || (s as any)?.partner?.state || "Ort folgt"}
                          {(s as any)?.partner?.name ? ` · ${(s as any).partner.name}` : ""}
                        </div>
                      </div>
                    ))}
                    {row.sessions && row.sessions.length > 3 && (
                      <div className="text-[11px] text-slate-500">… {row.sessions.length - 3} weitere Termine</div>
                    )}
                    {upcoming && <div className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-1 inline-flex">Nächster Slot: {upcoming.label}</div>}
                  </div>
                  <div className="text-sm text-slate-700">
                    <div className="font-semibold">{row.partner?.name ?? "–"}</div>
                    <div className="text-xs text-slate-500">{row.partner?.city ?? row.partner?.state ?? ""}</div>
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[row.status]}`}>
                      {statusLabel[row.status]}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100"
                      onClick={() => setSelected(row)}
                    >
                      Vorschau
                    </button>
                    <Link
                      href={`/kurs/${row.courseSlug}${row.session?.id ? `?booking=${row.session.id}` : ""}`}
                      className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white hover:-translate-y-0.5 transition"
                    >
                      Anmeldeseite
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selected && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4" onClick={() => setSelected(null)}>
            <div className="max-w-4xl w-full rounded-2xl bg-white shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-4">
                  {selected.image && (
                    <div className="relative h-20 w-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <Image src={selected.image} alt={selected.courseTitle} fill className="object-cover" sizes="200px" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Kampagne</p>
                    <h3 className="text-xl font-semibold text-slate-900">{selected.courseTitle}</h3>
                    {selected.session?.start_date && (
                      <p className="text-sm text-slate-600">
                        Start: {selected.session.start_date}
                        {selected.session.start_time ? ` · ${selected.session.start_time.slice(0, 5)} Uhr` : ""}
                        {selected.session.city ? ` · ${selected.session.city}` : selected.session.state ? ` · ${selected.session.state}` : ""}
                      </p>
                    )}
                    {selected.partner?.name && <p className="text-xs text-slate-500">Partner: {selected.partner.name}</p>}
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600" onClick={() => setSelected(null)}>
                  ×
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <h4 className="text-sm font-semibold text-slate-900">Kampagnenplan</h4>
                  {selected.plan.length === 0 && <p className="text-sm text-slate-600">Keine Slots verfügbar.</p>}
                  {selected.plan.map((p) => (
                    <div key={`${p.at}-${p.label}`} className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm">
                      <div>
                        <div className="font-semibold text-slate-900">{p.label}</div>
                        <div className="text-xs text-slate-500">{new Date(p.at).toLocaleDateString("de-AT")}</div>
                      </div>
                      <div className="flex gap-1 text-[11px]">
                        {p.platform.map((pl) => (
                          <span key={pl} className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700 uppercase">
                            {pl}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <h4 className="text-sm font-semibold text-slate-900">Content</h4>
                  {selected.content.length === 0 && <p className="text-sm text-slate-600">Noch kein Inhalt generiert.</p>}
                  {selected.content.map((c) => (
                    <div key={c.platform} className="rounded-lg bg-white border border-slate-200 p-3 space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">{c.platform}</span>
                        <span className="text-[11px] text-slate-500">Template: {c.template}</span>
                      </div>
                      <p className="font-semibold text-slate-900">{c.headline}</p>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{c.caption}</p>
                      {c.tiktokScript && (
                        <div className="rounded-md bg-slate-50 border border-slate-200 p-2 text-xs text-slate-700 space-y-1">
                          <div className="font-semibold">TikTok Skript</div>
                          <div>Hook: {c.tiktokScript.hook}</div>
                          <div>Scenes:
                            <ul className="list-disc list-inside space-y-0.5">
                              {c.tiktokScript.scenes.map((s, idx) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ul>
                          </div>
                          <div>CTA: {c.tiktokScript.closing}</div>
                        </div>
                      )}
                      {c.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 text-[11px] text-slate-600">
                          {c.hashtags.map((h) => (
                            <span key={h} className="rounded-full bg-slate-100 px-2 py-1 font-semibold">{h}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1 text-[11px]">
                        <button
                          className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100"
                          onClick={() => navigator.clipboard.writeText([c.headline, c.caption, c.hashtags.join(" ")].filter(Boolean).join("\n\n"))}
                        >
                          Text kopieren
                        </button>
                        <button
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 hover:bg-emerald-100"
                          onClick={() => updateStatus(selected.campaignId, "scheduled")}
                        >
                          Freigeben / Planen
                        </button>
                        <button
                          className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100"
                          onClick={() => updateStatus(selected.campaignId, "paused")}
                        >
                          Pausieren
                        </button>
                        <button
                          className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 font-semibold text-indigo-700 hover:bg-indigo-100"
                          onClick={() => updateStatus(selected.campaignId, "published")}
                        >
                          Als veröffentlicht markieren
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
