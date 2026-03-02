"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  className?: string;
  startScale?: number; // z.B. 1.53
  endScale?: number;   // z.B. 1
  animHeightPercent?: number; // Bereich in % der Viewport-Höhe, z.B. 17
};

export function ShrinkTitle({
  text,
  className = "",
  startScale = 1.53,
  endScale = 1,
  animHeightPercent = 17,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(startScale);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);
    let raf = 0;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const animHeight = (animHeightPercent / 100) * vh;
      // progress 0..1: wenn section-top von vh -> vh-animHeight wandert
      const raw = (vh - rect.top) / animHeight;
      const progress = clamp(raw, 0, 1);
      const s = startScale + (endScale - startScale) * progress;
      setScale(s);
      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [animHeightPercent, startScale, endScale]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center",
        transition: "transform 40ms linear",
        willChange: "transform",
      }}
    >
      {text}
    </div>
  );
}
