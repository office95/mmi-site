"use client";

import { useState } from "react";

type Module = { title?: string | null; hours?: number | null; topic?: string | null; description?: string | null };

export function CourseModulesAccordion({ modules }: { modules: Module[] }) {
  const [open, setOpen] = useState<boolean>(false);
  if (!modules || modules.length === 0) return null;

  const colLabel = (m: Module) => m.topic || m.description || "–";

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <h3 className="text-lg font-semibold text-slate-900">Kursinhalt</h3>
        <span
          className={`ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition ${
            open ? "border-[#ff1f8f] text-[#ff1f8f] rotate-45" : "border-slate-300 text-slate-500"
          }`}
        >
          +
        </span>
      </button>

      {open && (
        <div className="divide-y divide-slate-100">
          <div className="grid grid-cols-12 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
            <div className="col-span-4 px-4 py-3">Modul</div>
            <div className="col-span-5 px-4 py-3">Thema</div>
            <div className="col-span-3 px-4 py-3 text-right">Zeitumfang</div>
          </div>
          {modules.map((m, idx) => (
            <div key={idx} className="grid grid-cols-12 items-center px-4 py-3 text-sm text-slate-800">
              <div className="col-span-4 font-semibold">{m.title || "Modul"}</div>
              <div className="col-span-5 text-slate-700">{colLabel(m)}</div>
              <div className="col-span-3 text-right text-slate-700">{m.hours ? `${m.hours} h` : "—"}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
