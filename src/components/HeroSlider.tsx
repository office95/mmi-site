"use client";

"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Slide = {
  src: string;
  alt?: string;
  title?: string;
  subtitle?: string;
};

const fallbackSlides: Slide[] = [
  {
    src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1800&q=80",
    title: "Hands-on Mixing",
    subtitle: "Live an echten Projekten lernen",
  },
];

export function HeroSlider({ slides }: { slides?: Slide[] }) {
  const validSlides = useMemo(() => (slides && slides.length ? slides : fallbackSlides), [slides]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % validSlides.length);
    }, 8000);
    return () => clearInterval(id);
  }, [validSlides.length]);

  return (
    <section className="relative isolate mt-0 h-full w-full overflow-hidden bg-black text-white">
      {validSlides.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-1200 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt ?? "Hero Slide"}
            fill
            className="object-cover"
            priority={i === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />
          <div className="absolute inset-0 flex items-center px-6 sm:px-10 lg:px-20">
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight">
                {slide.title}
              </h1>
              <p className="text-base sm:text-lg text-white/80">{slide.subtitle}</p>
            </div>
          </div>
        </div>
      ))}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {validSlides.map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 w-6 rounded-full transition ${
              i === index ? "bg-[#ff1f8f]" : "bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
