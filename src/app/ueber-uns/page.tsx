import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getRegion } from "@/lib/region";
import { fetchSeoForPage, resolvedSeoToMetadata } from "@/lib/seo-matrix";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const defaults = {
  pageKey: "ueber-uns",
  defaultSlug: "/ueber-uns",
  defaultTitle: "Über uns | Music Mission Institute",
  defaultDescription: "Wer wir sind, wofür wir stehen und wie wir Menschen in Musikproduktion, Tontechnik und DJing voranbringen.",
  defaultH1: "Über uns",
};

export async function generateMetadata() {
  const seo = await fetchSeoForPage(defaults);
  return resolvedSeoToMetadata(seo);
}

export default async function AboutPage() {
  const region = await getRegion();
  const isAT = region === "AT";
  const isDE = region === "DE";
  const seo = await fetchSeoForPage(defaults);
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />

      <header className="relative overflow-hidden text-white h-[50vh] sm:h-[55vh] lg:h-[60vh] min-h-[45vh] bg-black">
        {/* Video-Hintergrund */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <iframe
            src="https://player.vimeo.com/video/1169617556?background=1&autoplay=1&loop=1&muted=1&controls=0&title=0&byline=0&portrait=0&playsinline=1"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[100vh] w-[177vw] -translate-x-1/2 -translate-y-1/2"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            frameBorder="0"
            title="Über uns Video"
          />
        </div>
        {/* Overlays für Lesbarkeit */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/85 via-black/55 to-black/25" />
        <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_18%_22%,rgba(255,31,143,0.14),transparent_30%),radial-gradient(circle_at_78%_18%,rgba(255,74,170,0.1),transparent_28%),radial-gradient(circle_at_65%_78%,rgba(255,31,143,0.08),transparent_28%)] mix-blend-screen opacity-70 pointer-events-none" />
        <div className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center">
          <div className="mx-auto max-w-4xl space-y-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/70">Music Mission Institute</p>
            <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl leading-[1.05] drop-shadow-[0_12px_32px_rgba(0,0,0,0.45)]">{seo.h1}</h1>
            <p className="text-base sm:text-lg text-white/85 leading-relaxed">
              {seo.heroSubline ||
                (isAT
                  ? "Wir verbinden Praxis, Technologie und Kreativität. Unsere Mission: Menschen in Musikproduktion, Tontechnik und Performance auf das nächste Level zu heben – mit kompakten Extremkursen, tiefgehenden Intensivausbildungen und einem Netzwerk an starken Partner-Standorten in Österreich."
                  : "Wir verbinden Praxis, Technologie und Kreativität. Unsere Mission: Menschen in Musikproduktion, Tontechnik und Performance auf das nächste Level zu heben – mit kompakten Extremkursen, tiefgehenden Intensivausbildungen und einem Netzwerk an starken Partner-Standorten in Deutschland.")}
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-12 sm:pt-14 pb-4 space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60 p-6 sm:p-8">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">About</p>
            <h2 className="font-anton text-3xl sm:text-4xl leading-tight text-slate-900">Music Mission Institute</h2>
            <div className="space-y-4 text-slate-800 text-base sm:text-lg leading-relaxed">
              <p>
                Das Music Mission Institute ist ein österreichisches Ausbildungszentrum für Musikproduktion, Tontechnik, Vocal Coaching, DJing und viele weitere Bereiche der modernen Musik- und Audioproduktion.
              </p>
              <p>
                Unser Ziel ist es, Menschen das Wissen und die Fähigkeiten zu vermitteln, die sie brauchen, um ihre musikalischen Ideen professionell umzusetzen. Dabei setzen wir konsequent auf praxisorientiertes Lernen. Unsere Kurse werden von aktiven Profis aus der Musik- und Audiobranche geleitet, die ihre reale Studio- und Produktionserfahrung direkt in den Unterricht einbringen.
              </p>
              <p>
                Ein Teil der Ausbildung findet in professionellen Studios statt, wo Teilnehmer mit hochwertigem Equipment arbeiten und echte Produktionsabläufe kennenlernen. Gleichzeitig legen wir großen Wert darauf, dass das Gelernte auch im eigenen Homestudio umgesetzt werden kann, denn viele moderne Produktionen entstehen genau dort.
              </p>
              <p>
                Unsere Kurse finden in kleinen Gruppen statt und ermöglichen dadurch persönliche Betreuung und direkten Austausch. Mit unseren speziell entwickelten Extremkursen haben wir zudem ein Ausbildungsformat geschaffen, das in kurzer Zeit konzentriertes Praxiswissen vermittelt – kompakt, effizient und sofort anwendbar.
              </p>
              <p>
                Das Ausbildungsangebot umfasst neben Musikproduktion, Audio Engineering und DJing auch Bereiche wie Vocal Coaching, Songwriting sowie moderne Produktionsmethoden wie KI-gestützte Musikproduktion. Die vielen positiven Bewertungen unserer Teilnehmer, unter anderem auf Trustpilot, bestätigen den praxisnahen Ansatz und die hohe Qualität unserer Kurse.
              </p>
              <p>
                Alle Programme sind so konzipiert, dass sie berufsbegleitend absolviert werden können und sowohl für Einsteiger als auch für fortgeschrittene Musiker, Produzenten, Bands, DJs oder Content Creator geeignet sind.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12 sm:py-14 space-y-8">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm shadow-slate-200/60 grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 text-slate-800">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Unternehmen</p>
              <p className="font-anton text-2xl text-slate-900">Music Mission GmbH</p>
              <p className="text-base text-slate-700 leading-relaxed"></p>
              <div className="mt-4 space-y-1 text-slate-700">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Registereintrag</p>
                <p className="font-semibold text-slate-900">UID: ATU80644028</p>
                <p className="font-semibold text-slate-900">Firmenbuchnr.: FN 627518 x</p>
                <p className="text-slate-700">Gerichtsstand: Klagenfurt</p>
              </div>
            </div>
            <div className="space-y-2 text-slate-800">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Büro Öffnungszeiten</p>
              <p className="font-semibold text-slate-900">Montag - Donnerstag</p>
              <p className="text-slate-700">09:00 bis 17:00 Uhr</p>
              <p className="font-semibold text-slate-900 pt-1">Freitag</p>
              <p className="text-slate-700">09:00 bis 14:00 Uhr</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2">
          <h3 className="font-anton text-2xl text-slate-900">Kontaktangaben</h3>
          <p><Link href="https://www.musicmission.at" className="text-pink-600 hover:text-pink-700">www.musicmission.at</Link></p>
          <p>E-Mail: <Link href="mailto:office@musicmission.at" className="text-pink-600 hover:text-pink-700">office@musicmission.at</Link></p>
        </div>
      </section>
    </div>
  );
}
