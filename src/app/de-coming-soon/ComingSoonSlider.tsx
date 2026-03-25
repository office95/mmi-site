"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Slide = { src: string; title: string; subtitle: string };

const SLIDES: Slide[] = [
  {
    src: "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/12fd07d0-64ea-40d8-8ef7-a7961b9512fa.webp",
    title: "Hands-on im Studio",
    subtitle: "Live-Mixing, Recording & Sounddesign mit unseren Coaches",
  },
  {
    src: "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/dc09c738-147b-44ad-8f10-0a7b19c2cc8a.webp",
    title: "Praxis statt Theorie",
    subtitle: "Deine Tracks, deine Sessions – wir gehen direkt in die DAW",
  },
  {
    src: "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/db3152ef-7e1f-4a78-bb88-7528a892fdc4.webp",
    title: "Coaching im kleinen Team",
    subtitle: "Max. 8 Teilnehmer:innen, persönliches Feedback, echte Releases",
  },
];

export function ComingSoonSlider() {
  const [active, setActive] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), 4000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {SLIDES.map((s, idx) => (
          <div key={idx} className="relative min-w-full aspect-[16/9]">
            <Image src={s.src} alt={s.title} fill className="object-cover" priority={idx === 0} sizes="(min-width: 1024px) 900px, 100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 sm:left-10 sm:bottom-8 text-white drop-shadow-lg space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-white/80">Music Mission Institute</p>
              <h3 className="text-2xl sm:text-3xl font-semibold">{s.title}</h3>
              <p className="text-sm sm:text-base text-white/85">{s.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-2.5 w-2.5 rounded-full border border-white/60 transition ${i === active ? "bg-white" : "bg-white/20"}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
