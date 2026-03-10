import { Suspense } from "react";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function CourseInfo({ id, kurs }: { id: string; kurs?: string | null }) {
  const supabase = getSupabaseServiceClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id,start_date,start_time,city,state,price_cents,partner:partners(name,city,state),course:courses!inner(id,title,slug,hero_image_url)")
    .eq("id", id)
    .maybeSingle();

  const courseSlug = kurs || (session as any)?.course?.slug || (session as any)?.course?.id || "";

  if (!session) return null;

  const date = session.start_date
    ? new Date(session.start_date + "T00:00:00").toLocaleDateString("de-AT", { day: "2-digit", month: "short", year: "numeric" })
    : "Termin folgt";
  const time = session.start_time ? session.start_time.slice(0, 5) + " Uhr" : "";

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Buchung für</p>
          <h2 className="text-xl font-semibold text-slate-900">{session.course?.title ?? "Kurs"}</h2>
          <p className="text-sm text-slate-600">
            {date} {time && `· ${time}`} {session.city || session.state ? `· ${session.city ?? session.state}` : ""}
          </p>
          {session.partner?.name && (
            <p className="text-xs text-slate-500">
              Partner: {session.partner.name}
              {session.partner.city ? ` · ${session.partner.city}` : ""}
            </p>
          )}
        </div>
        {session.course?.hero_image_url && (
          <div className="hidden sm:block relative h-20 w-32 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={session.course.hero_image_url} alt={session.course.title ?? "Kurs"} className="h-full w-full object-cover" />
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
        {session.price_cents ? <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">{(session.price_cents / 100).toFixed(2)} €</span> : null}
        {courseSlug && (
          <a className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100" href={`/kurs/${courseSlug}`} target="_blank" rel="noreferrer">
            Kursdetails
          </a>
        )}
      </div>
    </div>
  );
}

export function CourseInfoFallback() {
  return <div className="mb-6 h-24 w-full animate-pulse rounded-2xl bg-slate-100" />;
}
