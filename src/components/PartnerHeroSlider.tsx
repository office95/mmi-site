"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Slide = {
  id?: string;
  src: string;
  label?: string;
};

type Props = {
  slides: Slide[];
  intervalMs?: number;
};

export function PartnerHeroSlider({ slides, intervalMs = 3000 }: Props) {
  const [index, setIndex] = useState(0);
  const siteBase = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const crmBase = (process.env.NEXT_PUBLIC_CRM_SUPABASE_URL || "").replace(/\/$/, "");

  const resolveSrc = (src: string) => {
    if (!src) return src;
    if (src.startsWith("http")) return src;
    if (src.startsWith("/")) return src;
    if (crmBase) return `${crmBase}/storage/v1/object/public/media/${src}`;
    if (siteBase) return `${siteBase}/storage/v1/object/public/media/${src}`;
    return src;
  };

  const cleaned = slides
    .filter((s) => s.src)
    .map((s) => ({
      ...s,
      src: resolveSrc(s.src),
    }));

  const resolved =
    cleaned.length > 0
      ? cleaned
      : [
          { src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1800&q=80" },
          { src: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1800&q=80" },
        ];

  const safeSlides =
    resolved.length >= 2
      ? resolved
      : resolved.length === 1
        ? [...resolved, { ...resolved[0], id: `${resolved[0].id ?? "dup"}-2` }]
        : resolved;

  useEffect(() => {
    if (safeSlides.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % safeSlides.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [safeSlides.length, intervalMs]);

  if (safeSlides.length === 0) {
    return <div className="h-full w-full bg-black" />;
  }

  return (
    <div className="relative h-full w-full">
      {safeSlides.map((slide, i) => {
        const active = i === index;
        return (
          <div
            key={slide.id ?? i}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              active ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.label ?? "Partner Slide"}
              fill
              priority={active}
              className="object-cover grayscale"
              sizes="100vw"
            />
            {slide.label ? (
              <div className="absolute left-6 top-6 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur">
                {slide.label}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
