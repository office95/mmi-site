"use client";

import React, { useRef } from "react";

type Props = { label: string; value: string; onChange: (v: string) => void };

export default function RichTextEditor({ label, value, onChange }: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const apply = (fmt: "bold" | "italic" | "underline" | "bullet") => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const selected = value.slice(start, end) || "Text";
    let inserted = selected;
    switch (fmt) {
      case "bold":
        inserted = `**${selected}**`;
        break;
      case "italic":
        inserted = `*${selected}*`;
        break;
      case "underline":
        inserted = `<u>${selected}</u>`;
        break;
      case "bullet": {
        const lines = selected.split(/\n/).map((l) => (l.trim().startsWith("-") ? l : `- ${l}`));
        inserted = lines.join("\n");
        break;
      }
    }
    const newVal = value.slice(0, start) + inserted + value.slice(end);
    onChange(newVal);
    // restore cursor
    requestAnimationFrame(() => {
      const pos = start + inserted.length;
      ta.setSelectionRange(pos, pos);
      ta.focus();
    });
  };

  const btn =
    "rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#ff1f8f] hover:text-[#ff1f8f]";

  return (
    <label className="space-y-1 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-slate-600">{label}</span>
        <div className="flex gap-1">
          <button type="button" className={btn} onClick={() => apply("bold")}>
            B
          </button>
          <button type="button" className={btn} onClick={() => apply("italic")}>
            I
          </button>
          <button type="button" className={btn} onClick={() => apply("underline")}>
            U
          </button>
          <button type="button" className={btn} onClick={() => apply("bullet")}>
            •
          </button>
        </div>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#ff1f8f] focus:outline-none"
        placeholder="Text hier eingeben…"
      />
      <p className="text-[11px] text-slate-500">Toolbar fügt Markdown/HTML ein: **fett**, *kursiv*, &lt;u&gt;unterstrichen&lt;/u&gt;, Listen mit „- “.</p>
    </label>
  );
}
