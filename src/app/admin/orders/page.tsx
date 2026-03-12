"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import useSWR from "swr";
import { ChevronDown } from "lucide-react";

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || "Fehler beim Laden");
  }
  return json;
};

function StatusSelect({ app, mutate }: { app: any; mutate: () => void }) {
  const [saving, setSaving] = useState(false);
  const update = async (status: string) => {
    setSaving(true);
    await fetch("/api/admin/diploma-applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: app.id, status }),
    });
    setSaving(false);
    mutate();
  };
  const badge =
    app.status === "open"
      ? "bg-amber-100 text-amber-700"
      : app.status === "contacted"
      ? "bg-blue-100 text-blue-700"
      : app.status === "converted"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-200 text-slate-700";

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>{app.status || "open"}</span>
      <select
        className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
        value={app.status || "open"}
        disabled={saving}
        onChange={(e) => update(e.target.value)}
      >
        <option value="open">open</option>
        <option value="contacted">contacted</option>
        <option value="converted">converted</option>
        <option value="rejected">rejected</option>
      </select>
    </div>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: string; tone: "green" | "amber" | "blue" }) {
  const colors =
    tone === "green"
      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
      : tone === "amber"
      ? "bg-amber-50 border-amber-100 text-amber-800"
      : "bg-blue-50 border-blue-100 text-blue-800";
  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${colors}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-600">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function FilterDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const activeLabel = options.find((o) => o.value === value)?.label ?? "Filter";
  return (
    <div className="relative inline-block text-left">
      <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
        <ChevronDown size={14} />
        {activeLabel}
      </button>
      <div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 bg-white shadow-lg">
        {options.map((o) => (
          <button
            key={o.value}
            className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${o.value === value ? "font-semibold text-slate-900" : "text-slate-700"}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { data, error, isLoading } = useSWR("/api/admin/orders", fetcher, { refreshInterval: 15000, revalidateOnFocus: true });
  const {
    data: appsData,
    error: appsError,
    isLoading: appsLoading,
    mutate: mutateApps,
  } = useSWR("/api/admin/diploma-applications", fetcher, { refreshInterval: 30000, revalidateOnFocus: true });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tab, setTab] = useState<"orders" | "applications">("orders");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  const orders = data?.data ?? [];
  const applications = appsData?.data ?? [];

  const filtered = useMemo(() => {
    const list = statusFilter === "all" ? orders : orders.filter((o: any) => o.status === statusFilter);
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((o: any) => {
      const hay = [
        o.order_number,
        o.email,
        o.customer_name,
        o.first_name,
        o.last_name,
        o.course?.title,
        o.course?.slug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, query, statusFilter]);

  const kpiPaid = useMemo(() => orders.filter((o: any) => o.status === "paid"), [orders]);
  const kpiPending = useMemo(() => orders.filter((o: any) => o.status !== "paid"), [orders]);
  const sum = (arr: any[]) =>
    arr.reduce((acc, o) => {
      const val = typeof o.amount_cents === "number" ? o.amount_cents : o.course?.base_price_cents ?? 0;
      return acc + (val || 0);
    }, 0);
  const totalPaid = sum(kpiPaid) / 100;
  const totalPending = sum(kpiPending) / 100;
  const applicationsOpen = applications.filter((a: any) => a.status === "open").length;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin</p>
            <h1 className="font-anton text-3xl">Bestellungen & Anmeldungen</h1>
            <p className="text-sm text-slate-600">Bestellungen (Stripe) und Diploma-Anmeldungen.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="w-full sm:w-64">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suche nach Nr., Kunde, E-Mail, Kurs"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            {tab === "orders" && (
              <FilterDropdown value={statusFilter} onChange={setStatusFilter} options={[{ value: "all", label: "Alle" }, { value: "paid", label: "Paid" }, { value: "pending", label: "Pending" }, { value: "canceled", label: "Canceled" }]} />
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <KpiCard label="Bezahlt (Summe)" value={`${totalPaid.toFixed(2)} €`} tone="green" />
          <KpiCard label="Offen (Summe)" value={`${totalPending.toFixed(2)} €`} tone="amber" />
          <KpiCard label="Orders (paid)" value={kpiPaid.length.toString()} tone="green" />
          <KpiCard label="Anmeldungen offen" value={applicationsOpen.toString()} tone="blue" />
        </div>

        <div className="flex gap-2 mb-4">
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === "orders" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"
            }`}
            onClick={() => setTab("orders")}
          >
            Bestellungen
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === "applications" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"
            }`}
            onClick={() => setTab("applications")}
          >
            Anmeldungen (Diploma)
          </button>
        </div>

        {tab === "orders" && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-xs sm:text-[13px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Bestellnr.</th>
                <th className="px-4 py-3 text-left">Datum</th>
                <th className="px-4 py-3 text-left">Kunde</th>
                <th className="px-4 py-3 text-left">Kurs</th>
                <th className="px-4 py-3 text-left">Termin/Partner</th>
                <th className="px-4 py-3 text-left">Gesamt</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Lädt…
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-red-600">
                    Fehler beim Laden.
                  </td>
                </tr>
              )}
              {filtered.map((o: any) => {
                const total = o.course?.base_price_cents ? o.course.base_price_cents / 100 : (o.amount_cents ?? 0) / 100;
                const statusColor =
                  o.status === "paid" ? "bg-emerald-100 text-emerald-700" : o.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-700";
                const partner = o.partner_name || o.session?.partner?.name || o.session?.partners?.name;
                return (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{o.order_number ?? "–"}</td>
                    <td className="px-4 py-3 text-slate-800">{new Date(o.created_at).toLocaleString("de-AT")}</td>
                    <td className="px-4 py-3 text-slate-800">
                      <div className="font-semibold">{o.customer_name || `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim() || "–"}</div>
                      <div className="text-xs text-slate-500">{o.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-900 font-semibold">{o.course?.title ?? "–"}</div>
                      <div className="text-xs text-slate-500">{o.course?.slug ?? ""}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-800 text-sm">
                      {o.session?.start_date ? (
                        <div>
                          {o.session.start_date} {o.session.start_time ? `· ${o.session.start_time.slice(0, 5)} Uhr` : ""}
                        </div>
                      ) : (
                        "–"
                      )}
                      {partner && (
                        <div className="text-xs text-slate-500">
                          {partner}
                          {o.session?.partner?.city ? ` · ${o.session.partner.city}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-semibold align-top">{total ? `${total.toFixed(2)} €` : "–"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor}`}>{o.status || "?"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Keine Bestellungen gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}

        {tab === "applications" && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Datum</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Kontaktdaten</th>
                  <th className="px-4 py-3 text-left">Ort/Wunsch</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appsLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      Lädt…
                    </td>
                  </tr>
                )}
                {appsError && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-red-600">
                      Fehler beim Laden.
                    </td>
                  </tr>
                )}
                {!appsLoading &&
                  !appsError &&
                  applications.map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedApp(a)}>
                      <td className="px-4 py-3 text-slate-800">{new Date(a.created_at).toLocaleString("de-AT")}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {a.first_name} {a.last_name}
                        </div>
                        {a.birthdate && <div className="text-xs text-slate-500">Geb.: {a.birthdate}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 space-y-1">
                        <div className="text-sm">{a.email}</div>
                        {a.phone && <div>{a.phone}</div>}
                        {a.street && (
                          <div>
                            {a.street}
                            {a.zip || a.city ? `, ${a.zip ?? ""} ${a.city ?? ""}` : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800">
                        {a.city || a.location_preference ? (
                          <div>
                            {a.city}
                            {a.location_preference ? ` · Wunsch: ${a.location_preference}` : ""}
                          </div>
                        ) : (
                          "–"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusSelect app={a} mutate={mutateApps} />
                      </td>
                    </tr>
                  ))}
                {!appsLoading && !appsError && applications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      Keine Anmeldungen gefunden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setSelectedApp(null)}>
          <div
            className="max-w-lg w-full rounded-2xl bg-white shadow-2xl p-6 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Anmeldung</p>
                <h3 className="text-xl font-semibold text-slate-900">
                  {selectedApp.first_name} {selectedApp.last_name}
                </h3>
                <p className="text-xs text-slate-500">{new Date(selectedApp.created_at).toLocaleString("de-AT")}</p>
              </div>
              <button className="text-slate-500 hover:text-slate-700" onClick={() => setSelectedApp(null)}>
                ×
              </button>
            </div>
            <div className="space-y-1 text-sm text-slate-800">
              <p>
                <strong>E-Mail:</strong> {selectedApp.email}
              </p>
              {selectedApp.phone && (
                <p>
                  <strong>Telefon:</strong> {selectedApp.phone}
                </p>
              )}
              {selectedApp.birthdate && (
                <p>
                  <strong>Geburtsdatum:</strong> {selectedApp.birthdate}
                </p>
              )}
              {(selectedApp.street || selectedApp.zip || selectedApp.city) && (
                <p>
                  <strong>Adresse:</strong> {[selectedApp.street, selectedApp.zip, selectedApp.city].filter(Boolean).join(", ")}
                </p>
              )}
              {selectedApp.location_preference && (
                <p>
                  <strong>Kursstandort Wunsch:</strong> {selectedApp.location_preference}
                </p>
              )}
              <p>
                <strong>Status:</strong> {selectedApp.status}
              </p>
              <p className="text-xs text-slate-500">Quelle: Professional Audio Diploma</p>
            </div>
            <div className="pt-2">
              <StatusSelect app={selectedApp} mutate={mutateApps} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
