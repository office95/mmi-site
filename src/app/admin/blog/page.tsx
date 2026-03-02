"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  updated_at?: string | null;
  published_at?: string | null;
  partner_name?: string | null;
  author_type?: string | null;
};

type Partner = {
  id: string;
  name: string;
  email?: string | null;
};

const badge: Record<string, string> = {
  draft: "bg-slate-200 text-slate-800",
  pending: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

export default function AdminBlogPage() {
  const [rows, setRows] = useState<PostRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [tokenResult, setTokenResult] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState("");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [magicStatus, setMagicStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/posts", { cache: "no-store" });
        const json = await res.json();
        setRows(json?.data ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    fetch("/api/admin/partners")
      .then((r) => r.json())
      .then((p) => setPartners(p?.data ?? []))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => [r.title, r.slug, r.partner_name].filter(Boolean).join(" ").toLowerCase().includes(term));
  }, [q, rows]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Admin</p>
            <h1 className="font-anton text-3xl">Blog</h1>
          </div>
          <Link
            href="/admin/blog/new"
            className="rounded-full bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#e40073]"
          >
            Neuer Beitrag
          </Link>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suche Titel, Slug, Partner…"
          className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Magic-Link für Partner erstellen</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="w-full sm:w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
            >
              <option value="">Partner wählen…</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.email ? `(${p.email})` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={async () => {
                setTokenError(null);
                setTokenResult(null);
                setMagicStatus(null);
                if (!partnerId) {
                  setTokenError("Bitte Partner wählen");
                  return;
                }
                try {
                  const res = await fetch("/api/admin/magic-links", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ partner_id: partnerId || null }),
                  });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json?.error ?? "Fehler");
                  setTokenResult(json.data.token);
                  if (json.data.link) setMagicStatus(`Link gesendet an Partner. Magic-Link: ${json.data.link}`);
                } catch (e: any) {
                  setTokenError(e.message);
                }
              }}
              className="rounded-full bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#e40073]"
            >
              Link erzeugen
            </button>
          </div>
          {tokenResult && (
            <p className="text-sm text-emerald-600 break-all">
              Token: {tokenResult} <br />
              Link: {typeof window !== "undefined" ? `${window.location.origin}/partner-blog/create?token=${tokenResult}` : `/partner-blog/create?token=${tokenResult}`}
            </p>
          )}
          {tokenError && <p className="text-sm text-rose-600">{tokenError}</p>}
          {magicStatus && <p className="text-sm text-emerald-600">{magicStatus}</p>}
          <p className="text-xs text-slate-500">Partner-ID findest du in der Partnerliste.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Titel</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Partner</th>
                <th className="px-4 py-3 text-left font-semibold">Geändert</th>
                <th className="px-4 py-3 text-right font-semibold">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Lädt…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Keine Einträge.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{r.title}</div>
                      <div className="text-xs text-slate-500 break-all">{r.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge[r.status] ?? "bg-slate-200"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.partner_name ?? (r.author_type === "partner" ? "Partner" : "Admin")}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.updated_at ? new Date(r.updated_at).toLocaleDateString("de-AT") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        href={`/admin/blog/${r.id}`}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                      >
                        Bearbeiten
                      </Link>
                      <Link
                        href={`/blog/preview?slug=${encodeURIComponent(r.slug)}&id=${r.id}&preview=1`}
                        target="_blank"
                        className="rounded-full bg-[#ff1f8f] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#e40073]"
                      >
                        Ansehen
                      </Link>
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
