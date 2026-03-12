"use client";

import { useEffect, useMemo, useState } from "react";

type PeriodKey = "today" | "week" | "month" | "year";

const periodLabels: Record<PeriodKey, string> = {
  today: "Heute",
  week: "Diese Woche",
  month: "Dieser Monat",
  year: "Dieses Jahr",
};

type DashboardData = {
  orders: { total: number; paid: number; pending: number; canceled: number; revenue_cents_paid: number };
  automations: { sent: number; errors: number };
  diploma_applications: number;
  form_submissions: number;
};

export default function AdminHome() {
  const [data, setData] = useState<Record<PeriodKey, DashboardData> | null>(null);
  const [active, setActive] = useState<PeriodKey>("today");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Fehler beim Laden");
        setData(json.periods);
      } catch (e: any) {
        setError(e.message || "Fehler");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const current = useMemo(() => (data ? data[active] : null), [data, active]);

  const formatEur = (cents: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format((cents || 0) / 100);

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="tag">Admin</p>
            <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-slate-500">Key-KPIs für Bestellungen, Mails & Anmeldungen.</p>
          </div>
          <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white text-sm shadow-sm">
            {(Object.keys(periodLabels) as PeriodKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`px-4 py-2 transition ${
                  active === key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {periodLabels[key]}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Bestellungen" value={current?.orders.total} loading={loading || !current} />
          <StatCard title="Umsatz (paid)" value={current ? formatEur(current.orders.revenue_cents_paid) : "–"} loading={loading || !current} />
          <StatCard title="Paid / Pending" value={current ? `${current.orders.paid} / ${current.orders.pending}` : "–"} loading={loading || !current} />
          <StatCard title="Automations Mails" value={current ? `${current.automations.sent} gesendet` : "–"} hint={current ? `${current.automations.errors} Fehler` : ""} loading={loading || !current} />
          <StatCard title="Diploma Anmeldungen" value={current?.diploma_applications} loading={loading || !current} />
          <StatCard title="Formular Einsendungen" value={current?.form_submissions} loading={loading || !current} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <a
            href="/admin/orders"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Bestellungen
          </a>
          <a
            href="/admin/automationen"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Automationen
          </a>
          <a
            href="/admin/partners"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Partner
          </a>
          <a
            href="/admin/badges"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Badges
          </a>
          <a
            href="/admin/media"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Medien
          </a>
          <a
            href="/admin/hero"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Hero Slides
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, hint, loading }: { title: string; value: any; hint?: string; loading?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{loading ? "…" : value ?? "–"}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
