"use client";

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
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex gap-3 p-3">
                {courseHero && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={courseHero}
                    alt={courseTitle}
                    className="h-20 w-24 flex-none rounded-xl object-cover"
                  />
                )}
                <div className="flex-1 text-left space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold text-slate-700">
                    <span className="text-sm text-slate-900">{s.start_date ?? "Datum folgt"}</span>
                    {startTime && <span>Start: {startTime} Uhr</span>}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{courseTitle}</p>
                  {partnerName && <p className="text-sm text-slate-800">{partnerName}</p>}
                  {addr && <p className="text-xs text-slate-600">{addr}</p>}
                  {plzOrt && <p className="text-xs text-slate-600">{plzOrt}</p>}
                  {bundesland && <p className="text-xs text-slate-600">{bundesland}</p>}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-right text-xs text-slate-600">
                      {deposit !== null && <p>Anzahlung: {deposit.toFixed(2)} €</p>}
                      {price !== null && <p className="text-sm font-semibold text-slate-900">Preis: {price.toFixed(2)} €</p>}
                    </div>
                    <button
                      disabled={loading}
                      onClick={() => gotoBooking(s.id)}
                      className="rounded-lg bg-[#ff1f8f] px-3 py-2 text-xs font-semibold text-black shadow shadow-[#ff1f8f]/30 hover:bg-[#e40073] disabled:opacity-60"
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
