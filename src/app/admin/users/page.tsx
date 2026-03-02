"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: { role?: string; status?: string };
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
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

  const approve = async (id: string, role: string) => {
    const res = await fetch("/api/admin/users/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role, status: "approved" }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Fehler beim Aktualisieren");
    }
    await load();
  };

  return (
    <div className="px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="tag">Admin</p>
          <h1 className="text-2xl font-semibold text-slate-900">Benutzerverwaltung</h1>
          <p className="text-sm text-slate-500">Nutzer freischalten und Rollen setzen.</p>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">E-Mail</th>
                <th className="px-4 py-3">Rolle</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aktion</th>
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
                users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{u.email ?? "—"}</td>
                    <td className="px-4 py-3">{u.user_metadata?.role ?? "—"}</td>
                    <td className="px-4 py-3">{u.user_metadata?.status ?? "—"}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => approve(u.id, "employee")}
                        className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:border-emerald-400"
                      >
                        Mitarbeiter freischalten
                      </button>
                      <button
                        onClick={() => approve(u.id, "admin")}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-400"
                      >
                        Admin freischalten
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
    </div>
  );
}
