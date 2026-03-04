"use client";

import { useState } from "react";

type Module = { title: string; hours: number | null };
type FAQ = { question: string; answer: string };

export function CourseTabs({ modules, faqs }: { modules: Module[]; faqs: FAQ[] }) {
  const tabOptions: Array<"inhalt" | "faqs"> = ["inhalt", "faqs"];
  const [tab, setTab] = useState<(typeof tabOptions)[number]>("inhalt");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/85 shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
        {tabOptions.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 border transition ${
              tab === t
                ? "border-[#ff1f8f] bg-[#ff1f8f]/10 text-[#ff1f8f]"
                : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {t === "inhalt" ? "Kursinhalt" : "FAQs"}
          </button>
        ))}
      </div>

      {tab === "inhalt" && (
        <div className="divide-y divide-slate-100">
          <div className="grid grid-cols-12 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
            <div className="col-span-9 px-4 py-3">Modul / Thema</div>
            <div className="col-span-3 px-4 py-3 text-right">Zeitumfang</div>
          </div>
          {modules.length === 0 ? (
            <div className="px-4 py-5 text-sm text-slate-600">Noch keine Kursinhalte hinterlegt.</div>
          ) : (
            modules.map((m, idx) => (
              <div key={idx} className="grid grid-cols-12 items-center px-4 py-3 text-sm text-slate-800">
                <div className="col-span-9 font-semibold">{m.title || "Modul"}</div>
                <div className="col-span-3 text-right text-slate-700">{m.hours ? `${m.hours} h` : "—"}</div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "faqs" && (
        <div className="space-y-2 p-4">
          {faqs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Noch keine FAQs hinterlegt.
            </div>
          ) : (
            faqs.map((f, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
