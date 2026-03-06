"use client";

import { useEffect, useRef } from "react";

const STATES = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
];

export function ComingSoonMarquee() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let animation: number;
    let offset = 0;
    const step = () => {
      offset = (offset - 0.4) % track.scrollWidth;
      track.style.transform = `translateX(${offset}px)`;
      animation = requestAnimationFrame(step);
    };
    animation = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animation);
  }, []);

  return (
    <div className="overflow-hidden w-full border border-white/15 rounded-2xl bg-white/5 backdrop-blur">
      <div className="relative h-16 flex items-center">
        <div ref={trackRef} className="flex gap-8 whitespace-nowrap will-change-transform">
          {[...STATES, ...STATES].map((s, i) => (
            <span key={i} className="font-anton text-2xl sm:text-3xl text-white tracking-wide drop-shadow">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
