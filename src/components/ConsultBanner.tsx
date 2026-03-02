import Link from "next/link";
import React from "react";

type Props = {
  overlapOffset?: string | number;
  height?: string;
  zIndex?: string;
  formId?: string;
};

export default function ConsultBanner({
  overlapOffset = 0,
  height = "70vh",
  zIndex = "z-30",
  formId = "a6b28590-9885-42e8-a460-9ffd27b59ae3",
}: Props) {
  const overlapClass =
    overlapOffset && overlapOffset !== 0
      ? typeof overlapOffset === "number"
        ? `-mt-[${overlapOffset}px] pt-[${overlapOffset}px]`
        : `-mt-[${overlapOffset}] pt-[${overlapOffset}]`
      : "";

  return (
    <section
      className={`consult-banner relative w-full bg-white overflow-hidden ${zIndex} flex items-center justify-center ${
        overlapClass ?? ""
      }`}
      style={{ height, minHeight: height, maxHeight: height }}
    >
      <div className="mx-auto w-[92vw] max-w-[1200px] px-4 sm:px-10 lg:px-16 text-center space-y-6 absolute left-1/2 -translate-x-1/2 top-[30%]">
        <p className="font-anton text-5xl sm:text-6xl lg:text-[90px] leading-[0.95] text-slate-900 drop-shadow">
          Hol dir jetzt deine<br />kostenlose Beratung!
        </p>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
          Wir finden gemeinsam den perfekten Kurs und Termin für dich.
        </p>
        <Link
          href="/beratung"
          className="inline-flex items-center justify-center rounded-full bg-[#ff1f8f] px-5 py-3 text-sm font-semibold text-white !text-white hover:!text-white focus:!text-white active:!text-white shadow shadow-[#ff1f8f]/30 hover:bg-[#e40073] transition"
        >
          Beratung anfragen
        </Link>
      </div>
    </section>
  );
}
