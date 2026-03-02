"use client";

import { useState } from "react";

type FAQ = { q: string; a: string[] };

export function FAQAccordion({ items, initiallyOpen = 0 }: { items: FAQ[]; initiallyOpen?: number }) {
  const [open, setOpen] = useState<number>(initiallyOpen);

  return (
    <div className="space-y-3">
      {items.map((faq, idx) => (
        <div
          key={faq.q}
          className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <button
            className="flex w-full items-center justify-between gap-3 text-left text-base font-semibold text-slate-900"
            onClick={() => setOpen(open === idx ? -1 : idx)}
          >
            {faq.q}
            <span className={`text-slate-500 transition ${open === idx ? "rotate-90" : ""}`}>›</span>
          </button>
          {open === idx && (
            <div className="mt-3 space-y-2 text-sm text-slate-700 leading-relaxed">
              {faq.a.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
