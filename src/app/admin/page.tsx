"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { AlertTriangle } from "lucide-react";

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

type FollowUpAlert = {
  course_id: string;
  title: string;
  start_date: string;
  days_until: number;
};

type DashboardResponse = {
  periods: Record<PeriodKey, DashboardData>;
  live_courses_count?: number;
  alerts?: {
    missing_followups_count: number;
    missing_followups: FollowUpAlert[];
  };
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Fehler beim Laden");
  return json;
};

export default function AdminHome() {
  const supabase = getSupabaseBrowserClient();
  const { data, error, isLoading } = useSWR<DashboardResponse>("/api/admin/dashboard", fetcher, { refreshInterval: 15000, revalidateOnFocus: true });
  const [active, setActive] = useState<PeriodKey>("today");
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);

  const current = useMemo(() => (data ? data.periods?.[active] : null), [data, active]);

  const formatEur = (cents: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format((cents || 0) / 100);

  useEffect(() => {
    const loadLoggedInUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email?.trim() ?? null;
      setLoggedInEmail(email);
    };
    loadLoggedInUser();
  }, [supabase.auth]);

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-slate-500">Key-KPIs für Bestellungen, Mails & Anmeldungen.</p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <p className="text-right text-sm text-slate-600">
              Eingeloggt als <span className="font-semibold text-slate-900">{loggedInEmail ?? "—"}</span>
            </p>
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
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error.message || "Fehler"}</div>
        )}

        {!!data?.alerts?.missing_followups_count && (
          <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                  <AlertTriangle size={16} />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Folgekurs-Hinweis</h2>
                  <p className="text-sm text-slate-600">
                    {data.alerts.missing_followups_count} Kurs(e) ohne Folgekurs
                  </p>
                </div>
              </div>
              <Link
                href="/admin/courses?followup=1"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#ff1f8f] px-4 text-sm font-semibold text-black shadow-md shadow-[#ff1f8f]/20 hover:bg-[#e40073]"
              >
                Zu den Kursen
              </Link>
            </div>

            <div className="mt-3 space-y-2">
              {data.alerts.missing_followups.slice(0, 6).map((item) => (
                <div key={item.course_id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <span className="text-xs font-semibold text-rose-700">
                    {item.days_until < 0
                      ? `Seit ${Math.abs(item.days_until)} Tag(en) überfällig`
                      : item.days_until === 0
                        ? "Start heute"
                        : `Start in ${item.days_until} Tagen`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Kurse Live" value={data?.live_courses_count ?? 0} loading={isLoading || !data} />
          <StatCard title="Bestellungen" value={current?.orders.total} loading={isLoading || !current} />
          <StatCard title="Umsatz (paid)" value={current ? formatEur(current.orders.revenue_cents_paid) : "–"} loading={isLoading || !current} />
          <StatCard title="Paid / Pending" value={current ? `${current.orders.paid} / ${current.orders.pending}` : "–"} loading={isLoading || !current} />
          <StatCard title="Automations Mails" value={current ? `${current.automations.sent} gesendet` : "–"} hint={current ? `${current.automations.errors} Fehler` : ""} loading={isLoading || !current} />
          <StatCard title="Diploma Anmeldungen" value={current?.diploma_applications} loading={isLoading || !current} />
          <StatCard title="Formular Einsendungen" value={current?.form_submissions} loading={isLoading || !current} />
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, hint, loading }: { title: string; value: string | number | null | undefined; hint?: string; loading?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{loading ? "…" : value ?? "–"}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
