"use client";

import { useEffect, useMemo, useState } from "react";
import { GripVertical, Trash2, Save, Loader2 } from "lucide-react";

type Course = { id: string; title: string; slug: string };
type Slot = { id: string; label: string; sort_order: number; courses: Course[] };

const defaultSlots: Slot[] = [
  { id: "00000000-0000-0000-0000-000000000101", label: "Entdecken", sort_order: 0, courses: [] },
  { id: "00000000-0000-0000-0000-000000000102", label: "Intensiv", sort_order: 1, courses: [] },
  { id: "00000000-0000-0000-0000-000000000103", label: "Extrem", sort_order: 2, courses: [] },
];

export default function HeaderMenuPage() {
  const [slots, setSlots] = useState<Slot[]>(defaultSlots);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string>(defaultSlots[0].id);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeSlot = useMemo(() => slots.find((s) => s.id === activeSlotId) ?? slots[0], [slots, activeSlotId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [slotsRes, coursesRes] = await Promise.all([
          fetch("/api/admin/header-menu", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/admin/courses", { cache: "no-store" }).then((r) => r.json()),
        ]);
        const fetchedSlots: Slot[] = slotsRes?.data ?? [];
        if (fetchedSlots.length > 0) {
          const sorted = [...fetchedSlots].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          setSlots(sorted);
          setActiveSlotId(sorted[0]?.id || defaultSlots[0].id);
        } else {
          setSlots(defaultSlots);
          setActiveSlotId(defaultSlots[0].id);
        }
        setAllCourses(coursesRes?.data ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateSlotCourses = (slotId: string, courses: Course[]) => {
    setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, courses } : s)));
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, hoverIndex: number) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(from) || !activeSlot) return;
    const reordered = [...activeSlot.courses];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(hoverIndex, 0, moved);
    updateSlotCourses(activeSlot.id, reordered);
  };

  const addCourse = (courseId: string) => {
    if (!activeSlot) return;
    const course = allCourses.find((c) => c.id === courseId);
    if (!course) return;
    if (activeSlot.courses.some((c) => c.id === courseId)) return;
    updateSlotCourses(activeSlot.id, [...activeSlot.courses, course]);
  };

  const removeCourse = (courseId: string) => {
    if (!activeSlot) return;
    updateSlotCourses(
      activeSlot.id,
      activeSlot.courses.filter((c) => c.id !== courseId)
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        slots: slots.map((s, idx) => ({
          ...s,
          sort_order: idx,
          courses: s.courses.map((c, i) => ({ id: c.id, sort_order: i })),
        })),
      };
      const res = await fetch("/api/admin/header-menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`Speichern fehlgeschlagen: ${json?.error || res.statusText || "Unbekannter Fehler"}`);
      } else {
        console.log("Gespeichert", json);
        const slotsRes = await fetch("/api/admin/header-menu", { cache: "no-store" }).then((r) => r.json());
        const fetchedSlots: Slot[] = slotsRes?.data ?? [];
        const sorted = fetchedSlots.length ? [...fetchedSlots].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) : defaultSlots;
        setSlots(sorted);
        setActiveSlotId(sorted[0]?.id || defaultSlots[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-600">
        <Loader2 className="animate-spin" size={18} />
        Lädt…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Header-Menü</h1>
          <p className="text-sm text-slate-500">Ordne Kurse den Mega-Menüs zu und sortiere per Drag & Drop.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-4 py-2 text-white hover:bg-pink-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Speichern
        </button>
      </div>

      <div className="flex gap-4">
        <div className="w-64 space-y-2">
          {slots.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSlotId(s.id)}
              className={`w-full rounded-xl border px-3 py-2 text-left ${
                activeSlotId === s.id ? "border-pink-500 bg-pink-50 text-pink-700" : "border-slate-200 hover:border-pink-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-slate-500">Slot</p>
                <p className="text-lg font-semibold">{activeSlot?.label}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) addCourse(e.target.value);
                    e.target.value = "";
                  }}
                >
                  <option value="">Kurs hinzufügen…</option>
                  {allCourses
                    .filter((c) => !activeSlot?.courses.some((sc) => sc.id === c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {(activeSlot?.courses ?? []).map((c, idx) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, idx)}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <GripVertical size={16} className="text-slate-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{c.title}</p>
                  </div>
                  <button onClick={() => removeCourse(c.id)} className="text-slate-400 hover:text-pink-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {(activeSlot?.courses ?? []).length === 0 && (
                <p className="text-sm text-slate-500">Noch keine Kurse zugeordnet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
