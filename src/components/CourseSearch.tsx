"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Course = {
  id: string;
  title: string;
  slug: string;
  hero_image_url?: string | null;
  hero_image_mobile_url?: string | null;
  category_id?: string | null;
  type_id?: string | null;
  tags?: string[];
};

type CoursePartner = { partner?: string | null; state?: string | null; city?: string | null };

type Variant = "default" | "compact";

export default function CourseSearch({ variant = "default" }: { variant?: Variant }) {
  const [q, setQ] = useState("");
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [coursePartners, setCoursePartners] = useState<Record<string, CoursePartner[]>>({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/courses", { cache: "no-store" });
        const json = await res.json();
        const data: Course[] = (json?.data ?? []).map((c: any) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          hero_image_url: c.hero_image_url,
          hero_image_mobile_url: c.hero_image_mobile_url,
          category_id: c.category_id ?? null,
          type_id: c.type_id ?? null,
          tags: Array.isArray(c.tags) ? c.tags : [],
        }));
        setAllCourses(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Sessions laden, um Partner/Bundesland in die Suche einzubeziehen
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await fetch("/api/admin/sessions?open=1", { cache: "no-store" });
        const json = await res.json();
        const data: any[] = json?.data ?? [];
        const map: Record<string, CoursePartner[]> = {};
        data.forEach((s) => {
          const cid = s.course_id || s.course?.id;
          if (!cid) return;
          const entry: CoursePartner = {
            partner: s.partners?.name ?? null,
            state: s.state ?? s.partners?.state ?? null,
            city: s.city ?? s.partners?.city ?? null,
          };
          map[cid] = [...(map[cid] ?? []), entry];
        });
        setCoursePartners(map);
      } catch (e) {
        console.error(e);
      }
    };
    loadSessions();
  }, []);

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const res = await fetch("/api/admin/course-types", { cache: "no-store" });
        const json = await res.json();
        setTypes(json?.data ?? []);
      } catch (e) {
        console.error(e);
      }
    };
    loadTypes();
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const scored = allCourses
      .map((c) => {
        const hay = c.title?.toLowerCase() ?? "";
        const tagHay = (c.tags ?? []).join(" ").toLowerCase();
        const partnerHay = (coursePartners[c.id] ?? [])
          .map((p) => `${p.partner ?? ""} ${p.state ?? ""} ${p.city ?? ""}`)
          .join(" ")
          .toLowerCase();
        const matchTitle = hay.includes(term);
        const matchStart = hay.startsWith(term);
        const matchTag = tagHay.includes(term);
        const matchPartner = partnerHay.includes(term);
        const score =
          (matchStart ? 3 : 0) +
          (matchTitle ? 2 : 0) +
          (matchPartner ? 1 : 0) +
          (matchTag ? 0.5 : 0);
        return { c, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map((x) => x.c);
  }, [q, allCourses, coursePartners]);

  const compact = variant === "compact";

  return (
    <div className="relative">
      <div
        className={
          compact
            ? "flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 shadow-sm max-w-full focus-within:border-slate-300"
            : "flex items-center gap-3 rounded-[20px] border border-slate-200/80 bg-white/95 px-4 py-3 shadow-lg shadow-slate-300/40 backdrop-blur-sm"
        }
      >
        <div className={compact ? "flex h-6 w-6 items-center justify-center rounded-full bg-[#ff1f8f]/10 text-[#ff1f8f]" : "flex items-center justify-center h-9 w-9 rounded-full bg-[#ff1f8f]/10 text-[#ff1f8f]"}>
          <svg xmlns="http://www.w3.org/2000/svg" className={compact ? "h-[14px] w-[14px]" : "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            type="text"
            placeholder="Kurs, Bundesland, Tag..."
            className={
              compact
                ? "w-full border-none bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-0 md:text-sm"
                : "w-full border-none bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            }
            style={{
              fontSize: "16px",
            }
          />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          {loading && <span>lädt…</span>}
          {!loading && q && results.length === 0 && <span>Kein Treffer</span>}
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pointer-events-none" onMouseDown={(e) => e.preventDefault()}>
          <div className="mt-[62px] w-[82vw] max-w-[500px] max-h-[320px] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50 px-[2px] pointer-events-auto">
            <ul className="divide-y divide-slate-100" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
              {results.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/kurs/${c.slug}`}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50"
                    onClick={() => setOpen(false)}
                  >
                    <div className="relative h-12 w-12 min-w-[48px] overflow-hidden rounded-xl bg-slate-100">
                      {c.hero_image_url ? (
                        <Image src={c.hero_image_url} alt={c.title} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">Kein Bild</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                      <p className="text-[11px] text-slate-600 truncate">
                        {types.find((t) => t.id === c.type_id)?.name ?? "Kurs"}
                        {coursePartners[c.id]?.[0]?.partner ? ` · ${coursePartners[c.id][0].partner}` : ""}
                        {coursePartners[c.id]?.[0]?.state ? ` · ${coursePartners[c.id][0].state}` : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
