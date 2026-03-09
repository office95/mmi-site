"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Session = {
  id: string;
  start_date?: string | null;
  start_time?: string | null;
  partner_id?: string | null;
  city?: string | null;
  address?: string | null;
  state?: string | null;
  zip?: string | null;
  partners?: {
    name?: string | null;
    street?: string | null;
    strasse?: string | null;
    plz?: string | null;
    city?: string | null;
    state?: string | null;
    bundesland?: string | null;
    zip?: string | null;
    address?: string | null;
    country?: string | null;
  } | null;
  price_cents?: number | null;
  deposit_cents?: number | null;
};

export default function SessionCheckout({
  sessions,
  courseId,
  courseTitle,
  courseSlug,
  courseHero,
}: {
  sessions: Session[];
  courseId: string;
  courseTitle: string;
  courseSlug?: string;
  courseHero?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSlug = courseSlug || searchParams?.get("kurs") || searchParams?.get("slug") || "";

  const gotoBooking = (targetSessionId: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("courseId", courseId);
    if (currentSlug) params.set("kurs", currentSlug);
    // query fallback enthält sessionId nochmals
    params.set("sessionId", targetSessionId);
    router.push(`/buchen/${targetSessionId}?${params.toString()}`);
    setLoading(false);
  };

  if (!sessions.length) return null;

  const formatDate = (value?: string | null) =>
    value ? new Date(value + "T00:00:00Z").toLocaleDateString("de-AT", { weekday: "short", day: "2-digit", month: "short" }) : "Datum folgt";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-semibold text-slate-900">Termin buchen</p>
          <p className="text-xs text-slate-500">{courseTitle}</p>
        </div>
      </div>

      <div className="grid gap-4">
        {sessions.map((s) => {
          const price = s.price_cents ? s.price_cents / 100 : null;
          const deposit = s.deposit_cents ? s.deposit_cents / 100 : null;
          const partnerName = s.partners?.name;
          const addr =
            s.address ||
            s.partners?.address ||
            s.partners?.street ||
            s.partners?.strasse ||
            "";
          const plzOrt = [s.zip || s.partners?.zip || s.partners?.plz, s.city || s.partners?.city].filter(Boolean).join(" ");
          const bundesland = s.state || s.partners?.state || s.partners?.bundesland || "";
          const startTime = s.start_time ? s.start_time.toString().slice(0, 5) : null;
          return (
            <div
              key={s.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_40px_-26px_rgba(0,0,0,0.45)] transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5">
                {courseHero && (
                  <div className="relative w-full h-48 sm:h-40 md:h-48 overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={courseHero}
                      alt={courseTitle}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 600px"
                      priority={false}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-1 text-[11px]">
                      {formatDate(s.start_date)}
                      {startTime && <span className="text-white/80">• {startTime} Uhr</span>}
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">{courseTitle}</p>

                  {partnerName && (
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                      <span className="px-2.5 py-1 rounded-full bg-[#ff1f8f]/12 text-[#c10067] border border-[#ff1f8f]/30">
                        {partnerName}
                      </span>
                    </div>
                  )}

                  {addr && <p className="text-sm text-slate-600">{addr}</p>}
                  {plzOrt && <p className="text-sm text-slate-600">{plzOrt}</p>}
                  {bundesland && <p className="text-sm text-slate-500">{bundesland}</p>}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-1 sm:pt-0 sm:pl-4">
                    <div className="text-sm text-slate-700 space-y-0.5 text-right sm:text-left">
                      {price !== null && <p className="text-sm font-semibold text-[#e0007a]">Preis: {price.toFixed(2)} €</p>}
                    </div>
                    <button
                      disabled={loading}
                      onClick={() => gotoBooking(s.id)}
                      className="w-full sm:w-auto rounded-lg bg-[#ff1f8f] px-4 py-2.5 text-sm font-semibold text-white shadow shadow-[#ff1f8f]/30 hover:bg-[#e40073] disabled:opacity-60"
                    >
                      {loading ? "Weiter..." : "Buchen"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
