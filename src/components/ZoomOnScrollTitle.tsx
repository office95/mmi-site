"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  className?: string;
  widthClass?: string;
  targetOffsetVH?: number; // Endposition (vh vom Top)
  startOffsetVH?: number;  // Startposition (vh vom Top)
  startScale?: number;     // Startgröße
};

/**
 * Scroll-synchroner Fly/Zoom für sticky Sections: progress aus rect.bottom, damit der Text erst beim Weiterscrollen voll erscheint.
 */
export function ZoomOnScrollTitle({
  text,
  className = "",
  widthClass = "w-full",
  targetOffsetVH = 5,
  startOffsetVH = 40,
  startScale = 6,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0); // 0..1

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);
    let raf = 0;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // progress 0 -> 1, wenn top von vh -> 0 wandert
      const raw = 1 - rect.top / vh;
      setProgress(clamp(raw, 0, 1));
      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  const currentScale = startScale + (1 - startScale) * progress;
  const currentYvh = startOffsetVH + (targetOffsetVH - startOffsetVH) * progress;

  return (
    <div className={`mx-auto ${widthClass}`}>
      <div
        ref={ref}
        className={className}
        style={{
          transform: `translateY(${currentYvh}vh) scale(${currentScale})`,
          transition: "transform 45ms linear, opacity 120ms ease",
          opacity: 1,
          transformOrigin: "center",
          willChange: "transform",
        }}
      >
        {text}
      </div>
    </div>
  );
}
