"use client";

import { useState } from "react";

type Module = { title?: string | null; hours?: number | null; topic?: string | null; description?: string | null };

export function CourseModulesAccordion({ modules }: { modules: Module[] }) {
  const [open, setOpen] = useState<boolean>(false);
  if (!modules || modules.length === 0) return null;

  const topicLabel = (m: Module, idx: number) => {
    const topic = m.topic || m.title || m.description || "–";
    return `Modul ${idx + 1}: ${topic}`;
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Übersicht</p>
          <h3 className="text-xl font-semibold text-slate-900">Kursinhalt</h3>
        </div>
        <span
          className={`ml-3 inline-flex h-10 w-10 items-center justify-center rounded-full border text-base font-bold transition ${
            open ? "border-[#ff1f8f] text-[#ff1f8f] rotate-45" : "border-slate-300 text-slate-600"
          }`}
        >
          +
        </span>
      </button>

      {open && (
        <div className="divide-y divide-slate-100">
          <div className="grid grid-cols-12 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
            <div className="col-span-9 px-4 py-3">Thema</div>
            <div className="col-span-3 px-4 py-3 text-right">Zeitumfang</div>
          </div>
          {modules.map((m, idx) => (
            <div key={idx} className="grid grid-cols-12 items-center px-4 py-3 text-sm text-slate-800">
              <div className="col-span-9 text-slate-900 font-semibold">{topicLabel(m, idx)}</div>
              <div className="col-span-3 text-right text-slate-700">{m.hours ? `${m.hours} Std.` : "—"}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
