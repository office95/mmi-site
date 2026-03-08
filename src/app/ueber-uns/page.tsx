import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getRegion } from "@/lib/region";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Über uns | Music Mission Institute",
  description: "Wer wir sind, wofür wir stehen und wie wir Menschen in Musikproduktion, Tontechnik und DJing voranbringen.",
  alternates: { canonical: "/ueber-uns" },
  openGraph: {
    title: "Über uns | Music Mission Institute",
    description: "Lerne das Team und die Mission hinter den Music Mission Kursen kennen.",
    url: "/ueber-uns",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Über uns | Music Mission Institute",
    description: "Die Mission hinter den Kursen für Musikproduktion, Tontechnik & DJing.",
  },
};

export default function AboutPage() {
  const region = getRegion();
  const isAT = region === "AT";
  const isDE = region === "DE";
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />

      <header className="relative overflow-hidden text-white h-[40vh] sm:h-[50vh] lg:h-[60vh] min-h-[40vh] bg-black">
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
        <div className="absolute z-20 left-6 sm:left-12 top-[10%] max-w-3xl space-y-4 pr-6 sm:pr-0">
          <p className="text-xs uppercase tracking-[0.22em] text-white/70">Music Mission Institute</p>
          <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl leading-[1.1] drop-shadow">Über uns</h1>
          <p className="text-base sm:text-lg text-white/85">
            {isAT
              ? "Wir verbinden Praxis, Technologie und Kreativität. Unsere Mission: Menschen in Musikproduktion, Tontechnik und Performance auf das nächste Level zu heben – mit kompakten Extremkursen, tiefgehenden Intensivausbildungen und einem Netzwerk an starken Partner-Standorten in Österreich."
              : "Wir verbinden Praxis, Technologie und Kreativität. Unsere Mission: Menschen in Musikproduktion, Tontechnik und Performance auf das nächste Level zu heben – mit kompakten Extremkursen, tiefgehenden Intensivausbildungen und einem Netzwerk an starken Partner-Standorten in Deutschland."}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12 sm:py-14 space-y-8">
        <div className="space-y-4">
          <h2 className="font-anton text-3xl text-slate-900">Kontakt</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 text-slate-800">
              <p className="font-semibold text-lg">Music Mission GmbH</p>
              <p>Akazienweg 6<br />9131 Grafenstein</p>
              <div className="mt-4 space-y-1 text-slate-700">
                <p className="font-semibold text-slate-900">Registereintrag</p>
                <p>UID: ATU80644028</p>
                <p>Firmenbuchnr.: FN 627518 x</p>
                <p>Gerichtsstand: Klagenfurt</p>
              </div>
            </div>
            <div className="space-y-2 text-slate-800">
              <p className="font-semibold text-slate-900">Büro Öffnungszeiten</p>
              <p>Montag - Donnerstag<br />09:00 bis 17:00 Uhr</p>
              <p>Freitag<br />09:00 bis 14:00 Uhr</p>
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
