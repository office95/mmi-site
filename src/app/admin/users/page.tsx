"use client";

import { useEffect, useMemo, useState } from "react";

type UserRole = "employee" | "admin";
type UserStatus = "approved" | "pending" | "blocked";

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

const STATUS_OPTIONS: UserStatus[] = ["approved", "pending", "blocked"];
const ROLE_OPTIONS: UserRole[] = ["employee", "admin"];

function normalizeRole(role: string | null | undefined): UserRole {
  return role === "admin" ? "admin" : "employee";
}

function normalizeStatus(status: string | null | undefined): UserStatus {
  if (status === "approved" || status === "blocked") return status;
  return "pending";
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("de-AT", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { role: UserRole; status: UserStatus }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fehler beim Laden");
      const loadedUsers = (json.data ?? []) as User[];
      setUsers(loadedUsers);
      setDrafts(
        loadedUsers.reduce<Record<string, { role: UserRole; status: UserStatus }>>((acc, user) => {
          acc[user.id] = {
            role: normalizeRole(user.role),
            status: normalizeStatus(user.status),
          };
          return acc;
        }, {})
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upsertUser = async (id: string, role: UserRole, status: UserStatus) => {
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

  const updateDraft = (id: string, patch: Partial<{ role: UserRole; status: UserStatus }>) => {
    setDrafts((prev) => {
      const current = prev[id] ?? { role: "employee", status: "pending" as UserStatus };
      return { ...prev, [id]: { ...current, ...patch } };
    });
  };

  const isDirty = (user: User) => {
    const draft = drafts[user.id];
    if (!draft) return false;
    return draft.role !== normalizeRole(user.role) || draft.status !== normalizeStatus(user.status);
  };

  const pendingUsers = useMemo(() => users.filter((user) => user.status === "pending"), [users]);
  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !term || (user.email ?? "").toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || normalizeStatus(user.status) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  return (
    <div className="px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Benutzerverwaltung</h1>
          <p className="text-sm text-slate-500">
            Neue User registrieren sich selbst. Admins vergeben hier Rolle und Freischaltungsstatus.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        {info && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">Accounts ({filteredUsers.length})</p>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="E-Mail suchen…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:w-64"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="all">Alle Status</option>
                  <option value="approved">approved</option>
                  <option value="pending">pending</option>
                  <option value="blocked">blocked</option>
                </select>
              </div>
            </div>
          </div>
          <div className="space-y-3 p-4">
            {loading && <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Lädt…</div>}
            {!loading &&
              filteredUsers.map((user) => {
                const draft = drafts[user.id] ?? {
                  role: normalizeRole(user.role),
                  status: normalizeStatus(user.status),
                };
                return (
                  <div key={user.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{user.email ?? "—"}</p>
                        <p className="mt-1 text-xs text-slate-500">Registriert: {formatDate(user.created_at)}</p>
                        <p className="text-xs text-slate-500">Letzter Login: {formatDate(user.last_sign_in_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {roleBadge(user.role)}
                        {statusBadge(user.status)}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <select
                        value={draft.role}
                        onChange={(e) => updateDraft(user.id, { role: e.target.value as UserRole })}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <select
                        value={draft.status}
                        onChange={(e) => updateDraft(user.id, { status: e.target.value as UserStatus })}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => upsertUser(user.id, draft.role, draft.status)}
                        disabled={processingId === user.id || !isDirty(user)}
                        className="rounded-lg border border-slate-300 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        Speichern
                      </button>
                    </div>
                  </div>
                );
              })}
            {!loading && filteredUsers.length === 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                Keine Benutzer gefunden.
              </div>
            )}
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
