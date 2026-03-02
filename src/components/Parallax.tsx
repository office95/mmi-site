"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

type Props = {
  children: ReactNode;
  maxY?: number; // maximale vertikale Verschiebung in px
};

export default function Parallax({ children, maxY = 60 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: "translateY(30px)",
    opacity: 0,
  });

  useEffect(() => {
    const handle = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const center = rect.top + rect.height / 2;
      const norm = center / vh; // 0 (oben) .. 1 (unten)
      const clamped = Math.min(Math.max(norm, 0), 1);
      const offset = (0.5 - clamped) * maxY;
      const opacity = Math.min(Math.max(1 - Math.abs(clamped - 0.5) * 2, 0), 1);
      setStyle({
        transform: `translateY(${offset}px)`,
        opacity,
      });
    };

    handle();
    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, [maxY]);

  return (
    <div
      ref={ref}
      style={{ transition: "transform 0.25s ease-out, opacity 0.25s ease-out", willChange: "transform, opacity", ...style }}
    >
      {children}
    </div>
  );
}
