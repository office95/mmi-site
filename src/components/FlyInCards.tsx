"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type FlyCardProps = {
  title: string;
  subtitle: string;
  text: string;
  image: string;
  align: "left" | "right";
  href?: string;
};

const cards: FlyCardProps[] = [
  {
    title: "Extremkurse",
    subtitle: "",
    text: "Maximales Wissen in kurzer Zeit – keine Prüfungen, Praxis pur.",
    image: "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/e1e70f08-f6ec-4d03-9553-13a0e8b465e1.webp",
    align: "left",
    href: "/extremkurs",
  },
  {
    title: "Intensivkurse",
    subtitle: "",
    text: "Ideal, wenn du ein Diploma oder ein Studium anstreben willst.",
    image: "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/3e6eb2cb-ad29-4c6f-a4b5-973b9d56f70e.webp",
    align: "right",
    href: "/intensiv",
  },
  {
    title: "Professional Audio Diploma",
    subtitle: "Tontechnik",
    text: "",
    image: "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/dc09c738-147b-44ad-8f10-0a7b19c2cc8a.webp",
    align: "left",
    href: "/professional-audio-diploma",
  },
  {
    title: "Tontechnik Studium",
    subtitle: "Bachelor of Science (B.Sc.)",
    text: "",
    image: "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/fe29a645-6770-45a4-97c8-3499d8dcec7b.webp",
    align: "right",
  },
];

export function FlyInCards() {
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          const alreadySeen = el.dataset.seen === "1";
          // Nur beim ersten Eintritt animieren, dann abmelden.
          if (!alreadySeen && entry.intersectionRatio >= 0.35) {
            el.dataset.seen = "1";
            el.classList.add("in-view");
            observer.unobserve(el);
          }
        });
      },
      { threshold: [0.35], rootMargin: "0px 0px -10% 0px" }
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative bg-white h-full w-full px-4 sm:px-8 lg:px-20 py-10 sm:py-14 flex items-center">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 h-full">
        {cards.map((card, idx) => (
          <div
            key={card.title}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            className="group relative flex min-h-[30vh] sm:min-h-[36vh] md:min-h-[40vh] rounded-3xl bg-black border border-black/30 overflow-hidden card-reveal shadow-lg shadow-black/30"
            data-direction={card.align}
          >
            {card.align === "left" ? (
              <>
                <CardImage src={card.image} alt={card.title} align="left" />
                <CardCopy card={card} />
              </>
            ) : (
              <>
                <CardCopy card={card} />
                <CardImage src={card.image} alt={card.title} align="right" />
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function CardCopy({ card }: { card: FlyCardProps }) {
  return (
    <div className="relative z-20 flex h-full flex-col justify-center space-y-4 px-6 py-6 sm:px-8 lg:px-10 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)] md:items-start md:text-left text-left">
      <div className="space-y-2">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-anton font-bold leading-tight text-white">
          <span className="text-[#ff1f8f]">{card.title?.[0] ?? "X"}</span>
          {card.title?.slice(1) ?? "tremkurse"}
        </h2>
        {card.subtitle && (
          <h3 className="text-base font-semibold uppercase tracking-[0.15em] text-[#ff1f8f]">{card.subtitle}</h3>
        )}
        <p className="text-slate-100/90 drop-shadow-sm">{card.text}</p>
      </div>
      <a
        href={card.href ?? "#"}
        className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-[#ff1f8f] px-5 py-2 text-sm font-semibold text-black transition hover:-translate-y-1 hover:shadow-lg hover:bg-[#e40073]"
      >
        Mehr Infos
      </a>
    </div>
  );
}

function CardImage({ src, alt, align }: { src: string; alt: string; align: "left" | "right" }) {
  return (
    <div className="absolute inset-0 bg-black">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover scale-105 transition duration-700 ease-out group-hover:scale-110 brightness-[0.35]"
        sizes="50vw"
      />
      {align === "left" ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[55%] bg-gradient-to-l from-black via-black/75 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-500" />
      ) : (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-black via-black/75 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-500" />
      )}
    </div>
  );
}
