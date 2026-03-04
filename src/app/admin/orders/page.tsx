"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import useSWR from "swr";

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

export default function OrdersPage() {
  const { data, error, isLoading } = useSWR("/api/admin/orders", fetcher);
  const { data: appsData, error: appsError, isLoading: appsLoading, mutate: mutateApps } = useSWR("/api/admin/diploma-applications", fetcher);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"orders" | "applications">("orders");

  const orders = data?.data ?? [];
  const applications = appsData?.data ?? [];

  const filtered = useMemo(() => {
    if (!query.trim()) return orders;
    const q = query.toLowerCase();
    return orders.filter((o: any) => {
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
  }, [orders, query]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin</p>
            <h1 className="font-anton text-3xl">Bestellungen & Anmeldungen</h1>
            <p className="text-sm text-slate-600">Bestellungen (Stripe) und Diploma-Anmeldungen.</p>
          </div>
          <div className="w-full sm:w-64">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suche nach Nr., Kunde, E-Mail, Kurs"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
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
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Bestellnr.</th>
                <th className="px-4 py-3 text-left">Datum</th>
                <th className="px-4 py-3 text-left">Kunde</th>
                <th className="px-4 py-3 text-left">Kurs</th>
                <th className="px-4 py-3 text-left">Gesamt</th>
                <th className="px-4 py-3 text-left">Gutschein</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                    Lädt…
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-red-600">
                    Fehler beim Laden.
                  </td>
                </tr>
              )}
              {filtered.map((o: any) => {
                const total = o.course?.base_price_cents ? o.course.base_price_cents / 100 : (o.amount_cents ?? 0) / 100;
                const statusColor =
                  o.status === "paid" ? "bg-emerald-100 text-emerald-700" : o.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-700";
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
                    <td className="px-4 py-3 text-slate-800 font-semibold align-top">{total ? `${total.toFixed(2)} €` : "–"}</td>
                    <td className="px-4 py-3 text-slate-700 text-xs">
                      {o.promotion_code || o.coupon_code || "–"}
                      {o.discount_amount_cents ? (
                        <span className="block text-[11px] text-emerald-600">-{(o.discount_amount_cents / 100).toFixed(2)} €</span>
                      ) : null}
                    </td>
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
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
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
                    <tr key={a.id} className="hover:bg-slate-50">
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
    </div>
  );
}
