"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "mmi_open_day_popup_seen";
const DELAY_MS = 2000;

export default function OpenDayPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Prevent showing again within the same full page visit
    if (typeof window === "undefined") return;
    const seen = window.sessionStorage.getItem(STORAGE_KEY);
    if (seen === "1") return;

    const timer = window.setTimeout(() => {
      setOpen(true);
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    }, DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 sm:px-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
      <div className="relative w-full max-w-md sm:max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/60">
        <button
          aria-label="Popup schließen"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white"
        >
          ×
        </button>
        <div className="relative aspect-[4/5] sm:aspect-[4/4]">
          <Image
            src="https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/809c243f-c3c0-4447-961a-c9cbdd2cf4c6.webp"
            alt="Tag der offenen Tür"
            fill
            className="object-cover"
            sizes="(min-width: 640px) 480px, 100vw"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent h-24" aria-hidden />
        </div>
        <div className="p-5 sm:p-6 space-y-4 text-center">
          <h3 className="text-xl font-semibold text-slate-900">Tag der offenen Tür</h3>
          <p className="text-sm text-slate-600">
            Sichere dir kostenlos deinen Platz und lerne das Music Mission Institute live kennen.
          </p>
          <Link
            href="https://musicmission.at/tag-der-offenen-tuer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ff1f8f] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#ff1f8f]/40 transition hover:bg-[#e0007a]"
          >
            jetzt kostenlos anmelden
          </Link>
        </div>
      </div>
    </div>
  );
}
