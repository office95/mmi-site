"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";

type Course = { id: string; title: string; slug: string | null; hero: string | null; type: "Intensiv" | "Extrem" | "Kurs" };

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function CourseRail({ courses }: { courses: Course[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const list = useMemo(() => shuffle(courses), [courses]);

  const scrollBy = (delta: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (!list.length) return <p className="text-sm text-slate-600">Aktuell keine Kurse geladen.</p>;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
      <button
        type="button"
        aria-label="Scroll links"
        className="absolute left-0 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full border border-slate-200 bg-white text-pink-600 shadow-sm hover:bg-pink-50"
        onClick={() => scrollBy(-320)}
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Scroll rechts"
        className="absolute right-0 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full border border-slate-200 bg-white text-pink-600 shadow-sm hover:bg-pink-50"
        onClick={() => scrollBy(320)}
      >
        ›
      </button>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-slate-200 py-1 pr-6 pl-14 pr-14"
      >
        {list.map((c, idx) => (
          <Link
            key={c.id + idx}
            href={`/kurs/${c.slug || c.id}`}
            className="block min-w-[260px] max-w-[280px] rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_-24px_rgba(0,0,0,0.25)] overflow-hidden hover:-translate-y-0.5 transition"
          >
            <div className="relative h-36 w-full overflow-hidden">
              <Image
                src={c.hero || "/placeholder-course.jpg"}
                alt={c.title}
                fill
                className="object-cover"
                sizes="260px"
                priority={idx < 2}
              />
              <span
                className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold text-white ${
                  c.type === "Extrem"
                    ? "bg-[#ff1f8f]"
                    : c.type === "Intensiv"
                    ? "bg-slate-900"
                    : "bg-slate-500"
                }`}
              >
                {c.type}
              </span>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-base font-semibold text-slate-900 leading-tight line-clamp-2">{c.title}</p>
              <p className="text-xs text-slate-600">Mehr Infos</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
