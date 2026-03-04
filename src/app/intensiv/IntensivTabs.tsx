"use client";

import { useState } from "react";

type Module = { title: string; hours: number | null; course: string };
type FAQ = { question: string; answer: string; course: string };

export function IntensivTabs({ modules, faqs }: { modules: Module[]; faqs: FAQ[] }) {
  // Immer beide Tabs anzeigen; falls Daten fehlen, zeigen wir eine freundliche leere Ansicht.
  const tabOptions: Array<"inhalt" | "faqs"> = ["inhalt", "faqs"];
  const [tab, setTab] = useState<(typeof tabOptions)[number]>("inhalt");

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

      {tab === "inhalt" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-[0.14em]">
            <div className="col-span-9 px-4 py-3">Modul / Thema</div>
            <div className="col-span-3 px-4 py-3 text-right">Zeitumfang</div>
          </div>
          {modules.length === 0 ? (
            <div className="px-4 py-5 text-sm text-slate-600">Noch keine Kursinhalte hinterlegt.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {modules.map((m, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center px-4 py-3 text-sm text-slate-800">
                  <div className="col-span-9 flex flex-col gap-1">
                    <span className="font-semibold">{m.title || "Modul"}</span>
                    <span className="text-xs text-slate-500">{m.course}</span>
                  </div>
                  <div className="col-span-3 text-right text-slate-700">
                    {m.hours ? `${m.hours} h` : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "faqs" && (
        <div className="space-y-2">
          {faqs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
              Noch keine FAQs hinterlegt.
            </div>
          ) : (
            faqs.map((f, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-1">{f.course}</p>
                <p className="text-lg font-semibold text-slate-900">{f.question || "Frage"}</p>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{f.answer || "Antwort folgt."}</p>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
