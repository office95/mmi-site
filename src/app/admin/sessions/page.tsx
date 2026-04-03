/* eslint-disable @typescript-eslint/no-explicit-any */
// Kurstermine verwalten
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { useRouter } from "next/navigation";

type Session = {
  id: string;
  status?: "active" | "inactive" | string;
  region?: "AT" | "DE" | null;
  course_id?: string | null;
  partner_id?: string | null;
  start_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration_hours?: number | null;
  price_label?: string | null;
  price_cents?: number | null;
  deposit_cents?: number | null;
  tax_rate?: number | null;
  category_id?: string | null;
  format_id?: string | null;
  language_id?: string | null;
  min_participants?: number | null;
  max_participants?: number | null;
  tags?: string[];
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
};

type Course = {
  id: string;
  title: string;
  source_course_id?: string | null;
  status?: string;
  category_id?: string | null;
  format_id?: string | null;
  language_id?: string | null;
  type_id?: string | null;
  duration_hours?: number | null;
  base_price_cents?: number | null;
  deposit_cents?: number | null;
  tax_rate?: number | null;
  price_tiers?: { id?: string; label?: string; price_cents?: number; deposit_cents?: number; tax_rate?: number }[];
};

type Partner = {
  id: string;
  name: string;
  street?: string | null;
  zip?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};
type Option = { value: string; label: string };
type FollowUpAlert = { course_id: string; start_date: string };
type SessionWizardTab = "stammdaten" | "details" | "preis" | "tags";

const emptySession: Session = {
  id: "",
  status: "active",
  region: "AT",
  course_id: null,
  partner_id: null,
  start_date: null,
  start_time: null,
  end_time: null,
  duration_hours: null,
  price_label: null,
  price_cents: null,
  deposit_cents: null,
  tax_rate: null,
  category_id: null,
  format_id: null,
  language_id: null,
  min_participants: null,
  max_participants: null,
  tags: [],
};

const formatAuditDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("de-AT", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const hasMeaningfulUpdate = (createdAt?: string | null, updatedAt?: string | null, createdBy?: string | null, updatedBy?: string | null) => {
  const cBy = (createdBy ?? "").trim().toLowerCase();
  const uBy = (updatedBy ?? "").trim().toLowerCase();
  if (cBy && uBy && cBy !== uBy) return true;
  if (!createdAt || !updatedAt) return false;
  const createdMs = new Date(createdAt).getTime();
  const updatedMs = new Date(updatedAt).getTime();
  if (Number.isNaN(createdMs) || Number.isNaN(updatedMs)) return false;
  return updatedMs - createdMs > 60 * 1000;
};

const parseIsoDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const daysUntil = (date: Date) => Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

const formatStartDate = (value?: string | null) => {
  const date = parseIsoDate(value);
  if (!date) return "Datum fehlt";
  return new Intl.DateTimeFormat("de-AT", { dateStyle: "medium" }).format(date);
};

export default function SessionsPage() {
  const router = useRouter();
  const [followUpOnly, setFollowUpOnly] = useState(false);
  const [prefillCourseId, setPrefillCourseId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [formats, setFormats] = useState<Option[]>([]);
  const [languages, setLanguages] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [includePast, setIncludePast] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [allLoading, setAllLoading] = useState(false);

  const [editing, setEditing] = useState<Session | null>(null);
  const [tab, setTab] = useState<SessionWizardTab>("stammdaten");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUpAlerts, setFollowUpAlerts] = useState<FollowUpAlert[]>([]);

  const followUpStartByCourse = useMemo(() => {
    const map = new Map<string, string>();
    for (const alert of followUpAlerts) {
      if (!alert.course_id || !alert.start_date) continue;
      map.set(alert.course_id, alert.start_date);
    }
    return map;
  }, [followUpAlerts]);

  const followUpCourseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const courseId of followUpStartByCourse.keys()) {
      ids.add(courseId);
    }
    return ids;
  }, [followUpStartByCourse]);

  const followUpTargetSessionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const session of sessions) {
      if (!session.id || !session.course_id || !session.start_date) continue;
      if (!followUpCourseIds.has(session.course_id)) continue;
      if (session.start_date !== followUpStartByCourse.get(session.course_id)) continue;
      ids.add(session.id);
    }
    return ids;
  }, [sessions, followUpCourseIds, followUpStartByCourse]);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        !search ||
        getName(s.course_id, courses.map((c) => ({ id: c.id, name: c.title })))?.toLowerCase().includes(search.toLowerCase()) ||
        getName(s.partner_id, partners.map((p) => ({ id: p.id, name: p.name })))?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !filterStatus || (s.status ?? "") === filterStatus;
      const matchesType = !filterType || courses.find((c) => c.id === s.course_id)?.type_id === filterType;
      const matchesFormat = !filterFormat || courses.find((c) => c.id === s.course_id)?.format_id === filterFormat;
      const matchesLang = !filterLanguage || courses.find((c) => c.id === s.course_id)?.language_id === filterLanguage;
      const matchesFollowUp = !followUpOnly || followUpTargetSessionIds.has(s.id);
      return matchesSearch && matchesStatus && matchesType && matchesFormat && matchesLang && matchesFollowUp;
    });
  }, [sessions, search, filterStatus, filterType, filterFormat, filterLanguage, courses, partners, followUpOnly, followUpTargetSessionIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const active = params.get("followup") === "1";
    const courseId = params.get("courseId");
    setFollowUpOnly(active);
    setPrefillCourseId(courseId);
    if (active) setIncludePast(true);
  }, []);

  useEffect(() => {
    if (!prefillCourseId || editing) return;
    if (!courses.some((course) => course.id === prefillCourseId)) return;
    setEditing({ ...emptySession, id: uuid(), course_id: prefillCourseId });
    setTab("stammdaten");
    setPrefillCourseId(null);
  }, [prefillCourseId, courses, editing]);

  useEffect(() => {
    const load = async () => {
      const sessionsQuery = followUpOnly
        ? "all=1&include_past=1"
        : `${onlyOpen ? "open=1&" : ""}${includePast ? "include_past=1" : ""}`;
      const coursesPath = followUpOnly ? "/api/admin/courses?all=1" : "/api/admin/courses";
      const dashboardPath = followUpOnly ? "/api/admin/dashboard" : null;
      const [sRes, cRes, pRes, catRes, fRes, lRes, tRes, dRes] = await Promise.all([
        fetch(`/api/admin/sessions?${sessionsQuery}`),
        fetch(coursesPath),
        fetch("/api/admin/partners"),
        fetch("/api/admin/course-categories"),
        fetch("/api/admin/course-formats"),
        fetch("/api/admin/course-languages"),
        fetch("/api/admin/course-types"),
        dashboardPath ? fetch(dashboardPath, { cache: "no-store" }) : Promise.resolve(null),
      ]);
      if (sRes.ok) setSessions((await sRes.json()).data ?? []);
      if (cRes.ok) setCourses((await cRes.json()).data ?? []);
      if (pRes.ok) setPartners((await pRes.json()).data ?? []);
      if (catRes.ok) setCategories(((await catRes.json()).data ?? []).map((c: any) => ({ value: c.id, label: c.name })));
      if (fRes.ok) setFormats(((await fRes.json()).data ?? []).map((f: any) => ({ value: f.id, label: f.name })));
      if (lRes.ok) setLanguages(((await lRes.json()).data ?? []).map((l: any) => ({ value: l.id, label: l.name })));
      if (tRes.ok) setTypes(((await tRes.json()).data ?? []).map((t: any) => ({ value: t.id, label: t.name })));
      if (followUpOnly && dRes?.ok) {
        const payload = await dRes.json().catch(() => ({}));
        setFollowUpAlerts(payload?.alerts?.missing_followups ?? []);
      } else {
        setFollowUpAlerts([]);
      }
    };
    load();
  }, [onlyOpen, includePast, followUpOnly]);

  const openNew = () => {
    setEditing({ ...emptySession, id: uuid() });
    setTab("stammdaten");
  };
  const openEdit = (s: Session) => {
    setEditing({ ...s, tags: s.tags ?? [] });
    setTab("stammdaten");
  };
  const close = () => setEditing(null);

  const update = (patch: Partial<Session>) => setEditing((prev) => (prev ? { ...prev, ...patch } : prev));

  const save = async () => {
    if (!editing) return;
    if (!editing.course_id) {
      setError("Bitte Kurs wählen");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || res.statusText || "Speichern fehlgeschlagen");
      const list = await fetch("/api/admin/sessions", { cache: "no-store" }).then((r) => r.json());
      setSessions(list.data ?? []);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Diesen Kurstermin löschen?")) return;
    await fetch(`/api/admin/sessions/${id}`, { method: "DELETE" });
    const list = await fetch("/api/admin/sessions").then((r) => r.json());
    setSessions(list.data ?? []);
  };

  const loadAllSessions = async () => {
    setAllLoading(true);
    try {
      const res = await fetch("/api/admin/sessions?all=1", { cache: "no-store" });
      const json = await res.json();
      setAllSessions(json.data ?? []);
      setShowAllModal(true);
    } finally {
      setAllLoading(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === editing?.course_id);
  const wizardSteps: { id: SessionWizardTab; label: string }[] = useMemo(
    () => [
      { id: "stammdaten", label: "Stammdaten" },
      { id: "details", label: "Details" },
      { id: "preis", label: "Preis" },
      { id: "tags", label: "Tags" },
    ],
    []
  );
  const currentStepIndex = wizardSteps.findIndex((step) => step.id === tab);
  const isStepValid = (step: SessionWizardTab, session: Session | null) => {
    if (!session) return false;
    if (step === "stammdaten") {
      return Boolean(session.course_id && session.partner_id && session.start_date && session.status && session.region);
    }
    return true;
  };
  const goNextStep = () => {
    if (!editing) return;
    if (!isStepValid(tab, editing)) {
      setError("Bitte alle Pflichtfelder im aktuellen Schritt ausfüllen.");
      return;
    }
    setError(null);
    const next = wizardSteps[currentStepIndex + 1];
    if (next) setTab(next.id);
  };
  const goPrevStep = () => {
    const prev = wizardSteps[currentStepIndex - 1];
    if (prev) {
      setError(null);
      setTab(prev.id);
    }
  };
  const priceOptions = useMemo(() => {
    if (!selectedCourse) return [];
    const tiers =
      selectedCourse.price_tiers?.map((p, idx) => ({
        value: p.label || `tier-${idx}`,
        label: p.label || `Preisklasse ${idx + 1} (${(p.price_cents ?? 0) / 100} €)`,
        price_cents: p.price_cents ?? null,
        deposit_cents: p.deposit_cents ?? null,
        tax_rate: p.tax_rate ?? null,
      })) ?? [];
    const standard = {
      value: "standard",
      label: `Standard (${(selectedCourse.base_price_cents ?? 0) / 100} €)`,
      price_cents: selectedCourse.base_price_cents ?? null,
      deposit_cents: selectedCourse.deposit_cents ?? null,
      tax_rate: selectedCourse.tax_rate ?? null,
    };
    return [standard, ...tiers];
  }, [selectedCourse]);

  return (
    <div className="px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Kurstermine</h1>
            <p className="text-sm text-slate-500">Aktive und geplante Termine verwalten.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={openNew} className="rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-black shadow-md shadow-[#ff1f8f]/30 hover:bg-[#e40073]">
              + Neuen Kurstermin anlegen
            </button>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={includePast}
                onChange={(e) => setIncludePast(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-[#ff1f8f]"
              />
              Archivierte anzeigen
            </label>
            {followUpOnly && (
              <button
                onClick={() => {
                  setFollowUpOnly(false);
                  router.push("/admin/sessions");
                }}
                className="rounded-xl border border-[#ff1f8f] bg-[#fff0f7] px-4 py-2 text-sm font-semibold text-[#c90068] hover:bg-[#ffe3f2]"
              >
                Folgekurs-Filter beenden
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          {followUpOnly && (
            <div className="rounded-xl border border-[#ff1f8f]/30 bg-[#fff4fa] px-4 py-3 text-sm text-slate-800">
              Es werden nur Kurstermine zu Kursen angezeigt, bei denen aktuell ein Folgekurs fehlt ({followUpCourseIds.size} Kurse).
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            <Input label="Suche (Kurs oder Partner)" value={search} onChange={setSearch} />
            <Select
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: "", label: "Alle" },
                { value: "active", label: "Aktiv" },
                { value: "inactive", label: "Inaktiv" },
                { value: "archived", label: "Archiviert" },
              ]}
            />
            <Select
              label="Kurstyp"
              value={filterType}
              onChange={setFilterType}
              options={[{ value: "", label: "Alle" }, ...types]}
              placeholder="Kurstyp"
            />
            <Select
              label="Format"
              value={filterFormat}
              onChange={setFilterFormat}
              options={[{ value: "", label: "Alle" }, ...formats]}
              placeholder="Format"
            />
            <Select
              label="Sprache"
              value={filterLanguage}
              onChange={setFilterLanguage}
              options={[{ value: "", label: "Alle" }, ...languages]}
              placeholder="Sprache"
            />
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const courseName = getName(s.course_id, courses.map((c) => ({ id: c.id, name: c.title }))) ?? "—";
              const partnerName = getName(s.partner_id, partners.map((p) => ({ id: p.id, name: p.name }))) ?? "—";
              const courseTypeId = courses.find((c) => c.id === s.course_id)?.type_id || "";
              const courseTypeLabel = types.find((t) => t.value === courseTypeId)?.label || "—";
              const start = parseIsoDate(s.start_date);
              const remainingDays = start ? daysUntil(start) : null;
              const isArchived = (s.status ?? "") === "archived";
              return (
                <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 line-clamp-2">{courseName}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{partnerName}</p>
                      <p className="mt-1 inline-flex items-center gap-2 rounded-md border border-[#ff1f8f]/25 bg-[#fff3f9] px-2 py-1 text-xs font-semibold text-slate-900">
                        <span className="uppercase tracking-[0.08em] text-[10px] text-[#b0005d]">Kursstart</span>
                        <span>{formatStartDate(s.start_date)}</span>
                        {remainingDays !== null && (
                          <span className="text-[10px] text-slate-600">
                            {remainingDays < 0
                              ? `(${Math.abs(remainingDays)} Tage vorbei)`
                              : remainingDays === 0
                                ? "(heute)"
                                : `(in ${remainingDays} Tagen)`}
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Typ: {courseTypeLabel}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {(s.status ?? "active") === "active" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      ) : (
                        <span
                          className={
                            (s.status ?? "active") === "archived"
                              ? "rounded-full px-2 py-0.5 text-[11px] font-semibold border border-slate-300 text-slate-700"
                              : "rounded-full px-2 py-0.5 text-[11px] font-semibold border border-amber-200 text-amber-700"
                          }
                        >
                          {(s.status ?? "—") === "inactive" ? "Inaktiv" : (s.status ?? "—") === "archived" ? "Archiviert" : s.status ?? "—"}
                        </span>
                      )}
                      {isArchived && (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">Archiviert</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => openEdit(s)}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-[#ff1f8f] hover:text-[#ff1f8f]"
                    >
                      Bearbeiten
                    </button>
                    <button onClick={() => remove(s.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:border-red-400">
                      Löschen
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="text-sm text-slate-500">Keine Kurstermine gefunden.</div>}
          </div>
        </div>
      </div>

      {editing && (
        <Modal onClose={close} title={editing.id ? "Kurstermin bearbeiten" : "Neuer Kurstermin"}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold md:grid-cols-4">
              {wizardSteps.map((step, idx) => {
                const isActive = tab === step.id;
                const isDone = idx < currentStepIndex;
                const isAccessible = idx <= currentStepIndex;
                return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (isAccessible) {
                      setError(null);
                      setTab(step.id);
                    }
                  }}
                  disabled={!isAccessible}
                  className={`rounded-full px-3 py-2 border transition ${
                    isActive
                      ? "border-[#ff1f8f] bg-[#ff1f8f]/10 text-[#ff1f8f]"
                      : isDone
                        ? "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                        : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  {idx + 1}. {step.label}
                </button>
              );
            })}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <p>Erstellt: {formatAuditDate(editing.created_at)} · {editing.created_by ?? "—"}</p>
              {hasMeaningfulUpdate(editing.created_at, editing.updated_at, editing.created_by, editing.updated_by) && (
                <p>Geändert: {formatAuditDate(editing.updated_at)} · {editing.updated_by ?? "—"}</p>
              )}
            </div>

            {tab === "stammdaten" && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Select
                  label="Status"
                  value={editing.status ?? "active"}
                  onChange={(v) => update({ status: v })}
                  options={[
                    { value: "active", label: "Aktiv" },
                    { value: "inactive", label: "Inaktiv" },
                  ]}
                />
                <Select
                  label="Region"
                  value={editing.region ?? "AT"}
                  onChange={(v) => update({ region: (v as "AT" | "DE") ?? null })}
                  options={[
                    { value: "AT", label: "Österreich" },
                    { value: "DE", label: "Deutschland" },
                  ]}
                />
                <Select
                  label="Kurs"
                  value={editing.course_id ?? ""}
                  onChange={(v) => {
                    const course = courses.find((c) => c.id === v);
                    update({
                      course_id: v || null,
                      category_id: course?.category_id ?? null,
                      format_id: course?.format_id ?? null,
                      duration_hours: course?.duration_hours ?? null,
                      price_cents: course?.base_price_cents ?? null,
                      deposit_cents: course?.deposit_cents ?? null,
                      tax_rate: course?.tax_rate ?? null,
                    });
                  }}
                  options={courses.map((c) => ({ value: c.id, label: c.title }))}
                  placeholder="Kurs wählen"
                />
                <Select
                  label="Kurstyp (aus Kurs)"
                  value={selectedCourse?.type_id ?? ""}
                  onChange={() => {}}
                  options={types}
                  placeholder="—"
                />
                <Select
                  label="Partner"
                  value={editing.partner_id ?? ""}
                  onChange={(v) => update({ partner_id: v || null })}
                  options={partners.map((p) => ({ value: p.id, label: p.name }))}
                  placeholder="Partner wählen"
                />
                <Input label="Kursstart (Datum)" type="date" value={editing.start_date ?? ""} onChange={(v) => update({ start_date: v })} />
                <Input label="Startzeit" type="time" value={editing.start_time ?? ""} onChange={(v) => update({ start_time: v })} />
                <Input label="Endzeit" type="time" value={editing.end_time ?? ""} onChange={(v) => update({ end_time: v })} />
                <Input
                  label="Dauer (Stunden)"
                  type="number"
                  value={editing.duration_hours?.toString() ?? ""}
                  onChange={(v) => update({ duration_hours: v ? Number(v) : null })}
                  placeholder="z.B. 24"
                />
                <Select
                  label="Format"
                  value={editing.format_id ?? ""}
                  onChange={(v) => update({ format_id: v || null })}
                  options={formats}
                  placeholder="Format"
                />
                <Select
                  label="Kategorie"
                  value={editing.category_id ?? ""}
                  onChange={(v) => update({ category_id: v || null })}
                  options={categories}
                  placeholder="Kategorie"
                />
                <Select
                  label="Sprache"
                  value={editing.language_id ?? ""}
                  onChange={(v) => update({ language_id: v || null })}
                  options={languages}
                  placeholder="Sprache"
                />
                <Input
                  label="Mindestteilnehmer"
                  type="number"
                  value={editing.min_participants?.toString() ?? ""}
                  onChange={(v) => update({ min_participants: v ? Number(v) : null })}
                />
                <Input
                  label="Max. Teilnehmer"
                  type="number"
                  value={editing.max_participants?.toString() ?? ""}
                  onChange={(v) => update({ max_participants: v ? Number(v) : null })}
                />
              </div>
            )}

            {tab === "details" && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {editing.partner_id ? (
                  <>
                    {(() => {
                      const p = partners.find((x) => x.id === editing.partner_id);
                      return (
                        <>
                          <ReadOnly label="Straße" value={p?.street ?? "–"} />
                          <ReadOnly label="PLZ" value={p?.zip ?? "–"} />
                          <ReadOnly label="Ort" value={p?.city ?? "–"} />
                          <ReadOnly label="Bundesland" value={p?.state ?? "–"} />
                          <ReadOnly label="Land" value={p?.country ?? "–"} />
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    <Input label="Ort / Stadt" value={(editing as any).city ?? ""} onChange={(v) => update({ ...(editing as any), city: v })} />
                    <Input label="Adresse" value={(editing as any).address ?? ""} onChange={(v) => update({ ...(editing as any), address: v })} />
                  </>
                )}
              </div>
            )}

            {tab === "preis" && (
              <div className="space-y-3">
                {priceOptions.length > 0 && (
                  <Select
                    label="Preisklasse aus Kurs"
                    value={editing.price_label ?? ""}
                    onChange={(v) => {
                      const p = priceOptions.find((x) => x.value === v);
                      update({
                        price_label: v,
                        price_cents: p?.price_cents ?? null,
                        deposit_cents: p?.deposit_cents ?? null,
                        tax_rate: p?.tax_rate ?? null,
                      });
                    }}
                    options={priceOptions.map((p) => ({ value: p.value, label: p.label }))}
                    placeholder="Preisklasse wählen"
                  />
                )}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Input
                    label="Preis (EUR)"
                    value={editing.price_cents ? (editing.price_cents / 100).toString() : ""}
                    onChange={(v) => update({ price_cents: v ? Math.round(parseFloat(v) * 100) : null })}
                  />
                  <Input
                    label="Anzahlung (EUR)"
                    value={editing.deposit_cents ? (editing.deposit_cents / 100).toString() : ""}
                    onChange={(v) => update({ deposit_cents: v ? Math.round(parseFloat(v) * 100) : null })}
                  />
                  <Input label="Steuersatz (%)" value={editing.tax_rate?.toString() ?? ""} onChange={(v) => update({ tax_rate: v ? Number(v) : null })} />
                </div>
              </div>
            )}

            {tab === "tags" && (
              <TagInput
                tags={editing.tags ?? []}
                onAdd={(t) => update({ tags: Array.from(new Set([...(editing.tags ?? []), t])) })}
                onRemove={(t) => update({ tags: (editing.tags ?? []).filter((x) => x !== t) })}
              />
            )}

            <div className="pt-3 flex items-center gap-3">
              {currentStepIndex > 0 && (
                <button
                  onClick={goPrevStep}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
                >
                  Zurück
                </button>
              )}
              {currentStepIndex < wizardSteps.length - 1 ? (
                <button
                  onClick={goNextStep}
                  className="rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#ff1f8f]/30 hover:bg-[#e40073]"
                >
                  Weiter
                </button>
              ) : (
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#ff1f8f]/30 hover:bg-[#e40073] disabled:opacity-60"
                >
                  {saving ? "Speichern…" : "Speichern"}
                </button>
              )}
              <button onClick={close} className="text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900">
                Abbrechen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#ff1f8f] focus:outline-none"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#ff1f8f] focus:outline-none"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800">{value || "–"}</div>
    </div>
  );
}

function TagInput({ tags, onAdd, onRemove }: { tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void }) {
  const [value, setValue] = useState("");
  const add = () => {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue("");
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Tag eingeben und Enter"
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
        />
        <button onClick={add} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">
          Hinzufügen
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {t}
            <button onClick={() => onRemove(t)} className="text-slate-500 hover:text-red-500">
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-slate-500">Noch keine Tags.</span>}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function getName(id: string | null | undefined, list: { id: string; name: string }[]) {
  if (!id) return null;
  return list.find((c) => c.id === id)?.name ?? null;
}
