"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";

type Course = { id: string; title: string; slug: string | null; hero: string | null; type: "Intensiv" | "Extrem" | "Kurs" };

export default function CourseRail({ courses }: { courses: Course[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // keine zufällige Sortierung: hydrationsicher
  const list = useMemo(() => [...courses], [courses]);

  const scrollBy = (delta: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (!list.length) return <p className="text-sm text-slate-600">Aktuell keine Kurse geladen.</p>;

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-slate-200 py-1 pr-4"
      >
        {list.map((c, idx) => (
          <Link
            key={c.id + idx}
            href={`/kurs/${c.slug || c.id}`}
            className="block min-w-[220px] max-w-[240px] sm:min-w-[240px] sm:max-w-[260px] md:min-w-[260px] md:max-w-[280px] rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_-24px_rgba(0,0,0,0.25)] overflow-hidden hover:-translate-y-0.5 transition"
          >
            <div className="relative h-32 sm:h-36 md:h-40 w-full overflow-hidden">
              <Image
                src={c.hero || "/placeholder-course.jpg"}
                alt={c.title}
                fill
                className="object-cover"
                sizes="260px"
                priority={idx < 2}
              />
              {c.type !== "Kurs" && (
                <span
                  className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold text-white ${
                    c.type === "Extrem" ? "bg-[#ff1f8f]" : "bg-slate-900"
                  }`}
                >
                  {c.type}
                </span>
              )}
            </div>
            <div className="p-3 sm:p-4 space-y-2">
              <p className="text-sm sm:text-base font-semibold text-slate-900 leading-tight line-clamp-2">{c.title}</p>
              <p className="text-xs text-slate-600">Mehr Infos</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
