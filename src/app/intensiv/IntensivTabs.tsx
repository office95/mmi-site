"use client";

import { useState } from "react";

type Module = { title: string; hours: number | null; course: string };
type FAQ = { question: string; answer: string; course: string };

export function IntensivTabs({ modules, faqs }: { modules: Module[]; faqs: FAQ[] }) {
  const tabOptions: Array<"inhalt" | "faqs"> = [];
  if (modules.length) tabOptions.push("inhalt");
  if (faqs.length) tabOptions.push("faqs");
  const [tab, setTab] = useState<(typeof tabOptions)[number]>(tabOptions[0] ?? "inhalt");

  if (tabOptions.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-16 space-y-6">
      <div className="flex gap-3 text-xs font-semibold flex-wrap">
        {tabOptions.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-2 border transition ${
              tab === t ? "border-[#ff1f8f] text-[#ff1f8f] bg-[#ff1f8f]/10" : "border-slate-200 text-slate-600 hover:border-[#ff1f8f]/50"
            }`}
          >
            {t === "inhalt" ? "Kursinhalt" : "FAQs"}
          </button>
        ))}
      </div>

      {tab === "inhalt" && modules.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-[0.12em]">
            <div className="col-span-5 sm:col-span-6 px-4 py-3">Modul / Thema</div>
            <div className="col-span-4 sm:col-span-4 px-4 py-3">Kurs</div>
            <div className="col-span-3 sm:col-span-2 px-4 py-3 text-right">Zeit (Std.)</div>
          </div>
          <div className="divide-y divide-slate-100">
            {modules.map((m, idx) => (
              <div key={idx} className="grid grid-cols-12 items-center px-4 py-3 text-sm text-slate-800">
                <div className="col-span-5 sm:col-span-6 font-semibold">{m.title || "Modul"}</div>
                <div className="col-span-4 sm:col-span-4 text-slate-600">{m.course}</div>
                <div className="col-span-3 sm:col-span-2 text-right text-slate-700">{m.hours ? `${m.hours} h` : "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "faqs" && faqs.length > 0 && (
        <div className="space-y-2">
          {faqs.map((f, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1">{f.course}</p>
              <p className="text-lg font-semibold text-slate-900">{f.question || "Frage"}</p>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{f.answer || "Antwort folgt."}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
