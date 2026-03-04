"use client";

import { useState } from "react";

type FAQ = { question: string; answer: string };

export function FaqAccordion({ faqs }: { faqs: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 text-sm text-slate-600 shadow-sm">
        Noch keine FAQs hinterlegt.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {faqs.map((f, idx) => {
        const open = openIndex === idx;
        return (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition hover:border-slate-300"
          >
            <button
              onClick={() => setOpenIndex(open ? null : idx)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-base font-semibold text-slate-900">{f.question || "Frage"}</span>
              <span
                className={`ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition ${
                  open ? "border-[#ff1f8f] text-[#ff1f8f] rotate-45" : "border-slate-300 text-slate-500"
                }`}
              >
                +
              </span>
            </button>
            {open && (
              <div className="px-4 pb-4 text-sm text-slate-700 whitespace-pre-line">
                {f.answer || "Antwort folgt."}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
