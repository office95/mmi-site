"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

 type PageRow = {
  title: string;
  slug: string;
  type: "system" | "landing" | "course" | "partner" | "template";
  entity?: string | null;
  status?: string | null;
  updated_at?: string | null;
};

const typeLabel: Record<PageRow["type"], string> = {
  system: "System",
  landing: "Landing",
  course: "Kurs",
  partner: "Partner",
  template: "Template",
};

const badgeColor: Record<PageRow["type"], string> = {
  system: "bg-slate-100 text-slate-700",
  landing: "bg-emerald-100 text-emerald-700",
  course: "bg-pink-100 text-pink-700",
  partner: "bg-blue-100 text-blue-700",
  template: "bg-violet-100 text-violet-700",
};

export default function AdminPagesPage() {
  const [rows, setRows] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/pages", { cache: "no-store" });
        const json = await res.json();
        setRows(json?.data ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterType && r.type !== filterType) return false;
      if (!term) return true;
      return [r.title, r.slug, r.entity].filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [rows, q, filterType]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Admin</p>
            <h1 className="font-anton text-3xl text-slate-900">Seiten-Übersicht</h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suche nach Titel, Slug, Entität"
            className="w-full max-w-sm rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
          >
            <option value="">Alle Typen</option>
            <option value="system">System</option>
            <option value="landing">Landing</option>
            <option value="course">Kurs</option>
            <option value="partner">Partner</option>
            <option value="template">Template</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Titel</th>
                <th className="px-4 py-3 text-left font-semibold">Slug</th>
                <th className="px-4 py-3 text-left font-semibold">Typ</th>
                <th className="px-4 py-3 text-left font-semibold">Entität</th>
                <th className="px-4 py-3 text-left font-semibold">Letzte Änderung</th>
                <th className="px-4 py-3 text-right font-semibold">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Lade Seiten…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Keine Einträge gefunden.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.slug} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.title}</td>
                    <td className="px-4 py-3 text-slate-700 break-all">{r.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeColor[r.type]}`}>
                        {typeLabel[r.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.entity ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.updated_at ? new Date(r.updated_at).toLocaleDateString("de-AT") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {r.slug.includes("[") ? (
                        <>
                          <span className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Template</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(r.slug)}
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                          >
                            Copy Pfad
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href={r.slug}
                            target="_blank"
                            className="rounded-full bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-700"
                          >
                            Öffnen
                          </Link>
                          <button
                            onClick={() => navigator.clipboard.writeText(window.location.origin + r.slug)}
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                          >
                            Copy URL
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
