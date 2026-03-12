/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export default function AutomationenPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState({ subject: "", html_body: "", text_body: "", locale: "de-AT" });
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logFilters, setLogFilters] = useState({ search: "", status: "", automation_key: "", recipient: "" });
  const [logDetail, setLogDetail] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/automations", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fehler beim Laden");
      setItems(json.data || []);
    } catch (e: any) {
      setError(e.message || "Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (logFilters.search) params.set("search", logFilters.search);
      if (logFilters.status) params.set("status", logFilters.status);
      if (logFilters.automation_key) params.set("automation_key", logFilters.automation_key);
      if (logFilters.recipient) params.set("recipient", logFilters.recipient);
      const res = await fetch(`/api/admin/automation-logs?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fehler beim Laden der Logs");
      setLogs(json.data || []);
    } catch (e: any) {
      setLogsError(e.message || "Fehler");
    } finally {
      setLogsLoading(false);
    }
  }, [logFilters]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const openEdit = (item: any) => {
    const tpl = (item.templates || []).find((t: any) => t.locale === "de-AT") || item.templates?.[0] || {};
    setEditing(item);
    setDraft({
      subject: tpl.subject || "",
      html_body: tpl.html_body || "",
      text_body: tpl.text_body || "",
      locale: tpl.locale || "de-AT",
    });
  };

  const saveDraft = async () => {
    if (!editing) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Speichern fehlgeschlagen");
      setEditing(null);
      await load();
    } catch (e: any) {
      alert(e.message || "Fehler beim Speichern");
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = async (item: any) => {
    try {
      const res = await fetch("/api/admin/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, enabled: !item.enabled }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update fehlgeschlagen");
      await load();
    } catch (e: any) {
      alert(e.message || "Fehler beim Aktualisieren");
    }
  };

  const sendTest = async (item: any) => {
    const to = prompt("Testmail senden an:", "meine.mail@example.com");
    if (!to) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, to, locale: "de-AT" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Testversand fehlgeschlagen");
      alert(`Testmail an ${to} gesendet.`);
      await load();
    } catch (e: any) {
      alert(e.message || "Fehler beim Testversand");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 sm:px-8 py-10 space-y-10">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Admin</p>
          <h1 className="text-3xl font-bold text-slate-900">Automationen</h1>
          <p className="text-slate-600">Alle automatischen E-Mails, Trigger, Status & Logs.</p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Trigger</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Letzter Versand</th>
                <th className="px-4 py-3 text-left">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Lädt…
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">Key: {item.key}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.trigger || "–"}</td>
                    <td className="px-4 py-3">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800">
                        <div
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                            item.enabled ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            onChange={() => toggleEnabled(item)}
                            className="peer sr-only"
                            aria-label="Automation aktivieren/deaktivieren"
                          />
                          <span
                            className={`absolute left-1 h-3.5 w-3.5 rounded-full bg-white shadow transition ${
                              item.enabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </div>
                        {item.enabled ? "Aktiv" : "Inaktiv"}
                      </label>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {item.last_log ? (
                        <div>
                          <div>{new Date(item.last_log.sent_at).toLocaleString("de-AT")}</div>
                          <div className="text-[11px] text-slate-500">{item.last_log.recipient || ""}</div>
                        </div>
                      ) : (
                        "–"
                      )}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                      >
                        Template
                      </button>
                      <button
                        onClick={() => sendTest(item)}
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                      >
                        Testmail
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Logs</h2>
              <p className="text-sm text-slate-600">Historie aller gesendeten Automations-E-Mails.</p>
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Suche Betreff/Empfänger"
                value={logFilters.search}
                onChange={(e) => setLogFilters((f) => ({ ...f, search: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="Empfänger"
                value={logFilters.recipient}
                onChange={(e) => setLogFilters((f) => ({ ...f, recipient: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={logFilters.status}
                onChange={(e) => setLogFilters((f) => ({ ...f, status: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Status</option>
                <option value="success">success</option>
                <option value="error">error</option>
              </select>
              <select
                value={logFilters.automation_key}
                onChange={(e) => setLogFilters((f) => ({ ...f, automation_key: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Automation</option>
                {items.map((item) => (
                  <option key={item.id} value={item.key}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {logsError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{logsError}</div>}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Zeit</th>
                  <th className="px-4 py-3 text-left">Automation</th>
                  <th className="px-4 py-3 text-left">Empfänger</th>
                  <th className="px-4 py-3 text-left">Betreff</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logsLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      Lädt…
                    </td>
                  </tr>
                )}
                {!logsLoading && logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      Keine Einträge.
                    </td>
                  </tr>
                )}
                {!logsLoading &&
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setLogDetail(log)}>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{new Date(log.sent_at).toLocaleString("de-AT")}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{log.automation_key || "–"}</div>
                        <div className="text-xs text-slate-500">{log.locale || "de-AT"}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">{log.recipient}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">{log.subject}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            log.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {log.status}
                        </span>
                        {log.error_message && <div className="text-[11px] text-red-600">{log.error_message}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                        {log.text_preview || log.html_preview || "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="text-sm text-slate-500">
          <Link className="text-[#ff1f8f] hover:underline" href="/admin">
            Zurück zum Dashboard
          </Link>
        </div>
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Template bearbeiten: {editing.name}</h3>
                <p className="text-xs text-slate-500">Key: {editing.key} · Locale: {draft.locale}</p>
              </div>
              <button className="text-slate-500 hover:text-slate-800" onClick={() => setEditing(null)}>
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-800">
                Betreff
                <input
                  value={draft.subject}
                  onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-800">
                HTML
                <textarea
                  value={draft.html_body}
                  onChange={(e) => setDraft((d) => ({ ...d, html_body: e.target.value }))}
                  rows={8}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-800">
                Text (Plain)
                <textarea
                  value={draft.text_body}
                  onChange={(e) => setDraft((d) => ({ ...d, text_body: e.target.value }))}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                Abbrechen
              </button>
              <button
                onClick={saveDraft}
                className="rounded-full bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5 transition"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {logDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setLogDetail(null)}>
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Log-Detail</h3>
                <p className="text-xs text-slate-500">{logDetail.id}</p>
              </div>
              <button className="text-slate-500 hover:text-slate-800" onClick={() => setLogDetail(null)}>
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
              <div><span className="font-semibold">Zeit:</span> {new Date(logDetail.sent_at).toLocaleString("de-AT")}</div>
              <div><span className="font-semibold">Status:</span> {logDetail.status}</div>
              <div><span className="font-semibold">Empfänger:</span> {logDetail.recipient}</div>
              <div><span className="font-semibold">Betreff:</span> {logDetail.subject}</div>
              <div><span className="font-semibold">Automation:</span> {logDetail.automation_key || "–"}</div>
              <div><span className="font-semibold">Locale:</span> {logDetail.locale || "de-AT"}</div>
              {logDetail.error_message && <div className="sm:col-span-2 text-red-600">{logDetail.error_message}</div>}
              {logDetail.context_type && (
                <div className="sm:col-span-2">
                  <span className="font-semibold">Kontext:</span>{" "}
                  {logDetail.context_type} · {logDetail.context_id || "–"}{" "}
                  {logDetail.context_type === "order" && logDetail.context_id && (
                    <a className="text-[#ff1f8f] hover:underline" href={`/admin/orders/${logDetail.context_id}`}>
                      (zur Order)
                    </a>
                  )}
                  {logDetail.context_type === "form_submission" && logDetail.context_id && (
                    <a className="text-[#ff1f8f] hover:underline" href={`/admin/forms`}>
                      (zu Formular)
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 max-h-64 overflow-auto">
              <div className="font-semibold mb-1">Preview</div>
              <div className="whitespace-pre-wrap break-words">{logDetail.text_preview || logDetail.html_preview || "–"}</div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setLogDetail(null)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                Schließen
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/admin/automation-logs/resend", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ log_id: logDetail.id }),
                    });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error || "Fehler beim erneuten Versand");
                    alert("Erneut gesendet");
                    setLogDetail(null);
                    loadLogs();
                  } catch (e: any) {
                    alert(e.message || "Fehler");
                  }
                }}
                className="rounded-full bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5 transition"
              >
                Erneut senden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
