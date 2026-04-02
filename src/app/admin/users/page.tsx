"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  role?: string | null;
  status?: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  blocked: "bg-red-50 text-red-700 ring-red-200",
};

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-slate-900 text-white",
  employee: "bg-emerald-100 text-emerald-800",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"employee" | "admin">("employee");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fehler beim Laden");
      setUsers(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upsertUser = async (id: string, role: string, status: string) => {
    setProcessingId(id);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/admin/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role, status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Fehler beim Aktualisieren");
      }
      setInfo(`Rolle ${role} · Status ${status} gespeichert.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setProcessingId(null);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Benutzer wirklich endgültig löschen?")) return;
    setProcessingId(id);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Fehler beim Löschen");
      }
      setInfo("Benutzer gelöscht.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setProcessingId(null);
    }
  };

  const createUser = async () => {
    setCreating(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fehler beim Anlegen");
      setNewEmail("");
      setNewPassword("");
      setNewRole("employee");
      setInfo("Benutzer angelegt und sofort freigeschaltet.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setCreating(false);
    }
  };

  const statusBadge = (status: string | null | undefined) => {
    const normalized = status ?? "pending";
    const style = STATUS_STYLES[normalized] ?? "bg-slate-100 text-slate-700 ring-slate-200";
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${style}`}>
        {normalized}
      </span>
    );
  };

  const roleBadge = (role: string | null | undefined) => {
    const normalized = role ?? "employee";
    const style = ROLE_STYLES[normalized] ?? "bg-slate-100 text-slate-700";
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${style}`}>
        {normalized}
      </span>
    );
  };

  const pendingUsers = useMemo(() => users.filter((user) => user.status === "pending"), [users]);

  return (
    <div className="px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-1">
          <p className="tag">Admin</p>
          <h1 className="text-2xl font-semibold text-slate-900">Benutzerverwaltung</h1>
          <p className="text-sm text-slate-500">
            Rollenmodell mit Admin und Mitarbeiter: neue Registrierungen starten als Mitarbeiter mit Status <strong>pending</strong> und werden erst nach Freischaltung aktiv.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Neuen Benutzer im Backend anlegen</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-emerald-600">Direkt aktiv</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="E-Mail"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Passwort"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as typeof newRole)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="employee">Mitarbeiter</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={createUser}
              disabled={creating || !newEmail || !newPassword}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Benutzer anlegen
            </button>
            <p className="text-xs text-slate-500">Wird sofort freigeschaltet.</p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        {info && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-4 py-4 border-b border-slate-100 text-sm font-semibold text-slate-600 tracking-wide uppercase">Alle Accounts</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">E-Mail</th>
                  <th className="px-4 py-3">Rolle</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="px-4 py-3 text-slate-500" colSpan={4}>
                      Lädt…
                    </td>
                  </tr>
                )}
                {!loading &&
                  users.map((user) => (
                    <tr key={user.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">{user.email ?? "—"}</td>
                      <td className="px-4 py-3">{roleBadge(user.role)}</td>
                      <td className="px-4 py-3">{statusBadge(user.status)}</td>
                      <td className="px-4 py-3 space-y-2">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            onClick={() => upsertUser(user.id, "employee", "approved")}
                            disabled={processingId === user.id}
                            className="flex w-full justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:border-emerald-500 disabled:opacity-50"
                          >
                            Mitarbeiter aktivieren
                          </button>
                          <button
                            onClick={() => upsertUser(user.id, "admin", "approved")}
                            disabled={processingId === user.id}
                            className="flex w-full justify-center gap-2 rounded-lg border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                          >
                            Admin aktivieren
                          </button>
                          <button
                            onClick={() => upsertUser(user.id, user.role ?? "employee", "pending")}
                            disabled={processingId === user.id}
                            className="flex w-full justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:border-amber-500 disabled:opacity-50"
                          >
                            Rückstellen
                          </button>
                          <button
                            onClick={() => upsertUser(user.id, user.role ?? "employee", "blocked")}
                            disabled={processingId === user.id}
                            className="flex w-full justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:border-red-400 disabled:opacity-50"
                          >
                            Sperren
                          </button>
                        </div>
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={processingId === user.id}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:border-red-400 disabled:opacity-50"
                        >
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))}
                {!loading && users.length === 0 && (
                  <tr>
                    <td className="px-4 py-3 text-slate-500" colSpan={4}>
                      Keine Benutzer gefunden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pendingUsers.length > 0 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {pendingUsers.length} ausstehende Registrierung(en) warten auf Freischaltung durch Admin.
          </div>
        )}
      </div>
    </div>
  );
}
