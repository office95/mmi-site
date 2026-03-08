import { getSupabaseServiceClient } from "@/lib/supabase";
import { SiteHeader } from "@/components/SiteHeader";
import BookingFlow from "@/components/BookingFlow";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }> | { sessionId: string };
  searchParams: Promise<{ kurs?: string; sessionId?: string; courseId?: string }> | { kurs?: string; sessionId?: string; courseId?: string };
}) {
  const supabase = getSupabaseServiceClient();
  const resolvedParams = await Promise.resolve(params as any);
  const resolvedSearch = await Promise.resolve(searchParams as any);

  const sessionId =
    resolvedParams?.sessionId ||
    resolvedSearch?.sessionId ||
    resolvedSearch?.session ||
    "";
  const courseSlug = resolvedSearch?.kurs;
  const courseId = resolvedSearch?.courseId;
  let partner: any = null;
  let agbUrl: string | null = null;
  let privacyUrl: string | null = null;

  let session: any = null;
  let course: any = null;

  // 1) Direkt nach Session suchen
  if (sessionId && sessionId !== "undefined" && sessionId !== "null") {
    const { data: sess } = await supabase.from("sessions").select("*").eq("id", sessionId).maybeSingle();
    session = sess;
  }

  // 2) Falls Session fehlt, aber Kurs-Slug oder courseId da: ersten Termin dieses Kurses nehmen
  if (!session && (courseSlug || courseId)) {
    const { data: courseRow } = await supabase
      .from("courses")
      .select("id, title, slug, base_price_cents, deposit_cents, tax_rate, sessions(*)")
      .or(courseSlug ? `slug.eq.${courseSlug}` : "")
      .or(courseId ? `id.eq.${courseId}` : "")
      .maybeSingle();
    if (courseRow && courseRow.sessions && courseRow.sessions.length > 0) {
      const found = sessionId
        ? courseRow.sessions.find((s: any) => s.id === sessionId) || courseRow.sessions[0]
        : courseRow.sessions[0];
      session = found;
      course = {
        id: courseRow.id,
        title: courseRow.title,
        slug: courseRow.slug,
        base_price_cents: courseRow.base_price_cents,
        deposit_cents: courseRow.deposit_cents,
        tax_rate: courseRow.tax_rate,
      };
    }
  }

  // 3) Falls Session gefunden, aber Kurs noch nicht geladen: Kurs per course_id laden
  if (session && !course && session.course_id) {
    const { data: courseRow } = await supabase
      .from("courses")
      .select("id, title, slug, base_price_cents, deposit_cents, tax_rate")
      .eq("id", session.course_id)
      .maybeSingle();
    course = courseRow;
  }

  // Partner laden, falls vorhanden
  if (session?.partner_id) {
    const { data: partnerRow } = await supabase
      .from("partners")
      .select("id, name, city, state, country, zip")
      .eq("id", session.partner_id)
      .maybeSingle();
    partner = partnerRow;
  }

  // AGB / Datenschutz aus Einstellungen laden
  try {
    const { data: settingsRows } = await supabase
      .from("settings")
      .select("key,value")
      .in("key", ["pdf_agb_url", "pdf_datenschutz_url"]);
    agbUrl = settingsRows?.find((r: any) => r.key === "pdf_agb_url")?.value ?? null;
    privacyUrl = settingsRows?.find((r: any) => r.key === "pdf_datenschutz_url")?.value ?? null;
  } catch {
    /* fallback: null */
  }

  if (!session || !course) {
    return (
      <div className="min-h-screen bg-white text-slate-900">
        <SiteHeader />
        <main className="px-6 py-16 sm:px-10 lg:px-20 text-center space-y-4">
          <h1 className="font-anton text-3xl">Termin nicht gefunden</h1>
          <p className="text-slate-600">Der Kurstermin existiert nicht mehr oder die ID ist ungültig.</p>
          <p className="text-xs text-slate-500">
            Session-ID: {sessionId || "–"} · Kurs-Slug: {courseSlug || "–"} · Kurs-ID: {courseId || "–"}
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <SiteHeader />
      <main className="px-6 py-12 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-4xl mb-8 grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 p-5 sm:p-6 space-y-4">
            <div className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Buchung
            </div>
            <h1 className="font-anton text-4xl leading-tight text-slate-900 break-words">{course.title}</h1>

            <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Termin</div>
                <div className="text-sm font-semibold text-slate-900">
                  {session.start_date ?? "Datum folgt"}
                  {session.start_time ? ` · ${String(session.start_time).slice(0, 5)} Uhr` : ""}
                </div>
              </div>
              {(partner || session.city || session.address) && (
                <div className="grid gap-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Partner / Standort</div>
                  <div className="text-sm font-semibold text-slate-900">{partner?.name ?? "Kursstandort"}</div>
                  <div className="text-sm text-slate-700 leading-snug">
                    {[session.address, session.zip, partner?.city ?? session.city, partner?.state ?? session.state, partner?.country ?? session.country]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-gradient-to-br from-[#0ea5e9]/5 via-white to-[#ff1f8f]/5 p-5 sm:p-6 shadow-lg shadow-slate-200/60">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Preisinfo</p>
              {course.tax_rate !== 0 && course.tax_rate !== null && course.tax_rate !== undefined && (
                <span className="text-[11px] font-semibold text-slate-600">Alle Preise inkl. MwSt.</span>
              )}
            </div>
            <div className="mt-3 space-y-3 text-sm text-slate-800">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm shadow-slate-200/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Preis</span>
                  <span className="font-semibold text-slate-900">
                    {((session.price_cents ?? course.base_price_cents ?? 0) / 100).toFixed(2)} €
                  </span>
                </div>
                {session.deposit_cents ?? course.deposit_cents ? (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Anzahlung (jetzt)</span>
                    <span className="font-semibold text-slate-900">
                      {(((session.deposit_cents ?? course.deposit_cents) || 0) / 100).toFixed(2)} €
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                  <span className="text-slate-600">Zu zahlen jetzt</span>
                  <span className="font-bold text-[#ff1f8f]">
                    {(((session.deposit_cents ?? course.deposit_cents) || (session.price_cents ?? course.base_price_cents ?? 0)) / 100).toFixed(2)} €
                  </span>
                </div>
              </div>

              {course.tax_rate !== null && course.tax_rate !== undefined ? (
                course.tax_rate === 0 ? (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    Steuerfreie Bildungsmaßnahme gemäß § 6 Abs. 1 Z 11 UStG.
                  </p>
                ) : (
                  <p className="text-xs text-slate-600">
                    Steuersatz: {((course.tax_rate > 1 ? course.tax_rate / 100 : course.tax_rate) * 100).toFixed(1)} %
                  </p>
                )
              ) : null}
              <p className="text-xs text-slate-600">Details zur Zahlung im nächsten Schritt.</p>
            </div>
          </div>
        </div>
        <BookingFlow session={session} course={course} agbUrl={agbUrl} privacyUrl={privacyUrl} />
      </main>
    </div>
  );
}
