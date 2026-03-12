import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { PartnerCountryStateSelect } from "@/components/PartnerCountryStateSelect";
import { ScrollToFormButton } from "@/components/ScrollToFormButton";
import { fetchSeoForPage, resolvedSeoToMetadata } from "@/lib/seo-matrix";

export const revalidate = 3600;

const defaults = {
  pageKey: "partner-werden",
  defaultSlug: "/partner-werden",
  defaultTitle: "Partner werden | Music Mission Institute",
  defaultDescription:
    "Nutze dein Studio besser – wir bringen Teilnehmer, Marketing und Kursstruktur. Werde Partner im Music Mission Netzwerk.",
  defaultH1: "Partner werden",
  defaultHeroSubline: "Studio-Auslastung erhöhen, Marketing-Power nutzen, praxisnahe Kurse hosten – gemeinsam mit dem Music Mission Institute.",
};

export async function generateMetadata() {
  const seo = await fetchSeoForPage(defaults);
  return resolvedSeoToMetadata(seo);
}

const focusAreas = [
  "Tontechnik / Audio Engineering",
  "Musikproduktion",
  "Vocal Coaching",
  "Live-Tontechnik / Veranstaltungstechnik",
  "DJing / DJ Performance",
  "Songwriting",
  "Music Business",
  "Social Media für Musiker",
  "Content Creation / Video",
];

const benefits = [
  {
    title: "Mehr Auslastung – planbar",
    text: "Wir füllen freie Studio-Slots mit klaren Formaten: Extremkurse (kurz & preiswert) und Intensivkurse (strukturiert & vertiefend).",
  },
  {
    title: "Marketing- und Sichtbarkeits-Power inklusive",
    text: "Wir helfen dabei, die Online-Präsenz auszubauen, mit starkem Social-Media-Content Aufmerksamkeit zu schaffen und auf unserer Plattform gezielt sichtbar zu werden.",
  },
  {
    title: "Professionelle Kursinfrastruktur",
    text: "Lehrpläne, Skripte, Dozentenleitfäden, Buchungsplattform, Online-Lernportal – ready to go.",
  },
  {
    title: "Transparente Abrechnung",
    text: "Alle Buchungen über die Plattform, klare Revenue-Share, monatliches Reporting via Stripe Checkout.",
  },
  {
    title: "Starkes Netzwerk",
    text: "Du profitierst von einer Community aus Studios, Dozent:innen und Kreativprofis – gegenseitige Sichtbarkeit inklusive.",
  },
];

const steps = [
  { title: "Anfrage senden", text: "Stell uns kurz dein Studio oder deinen Fachbereich vor." },
  { title: "Kennenlernen", text: "Wir besprechen mögliche Kurse und die Zusammenarbeit." },
  { title: "Plattform & Einschulung", text: "Onboarding in die Music Mission Plattform und Ablauf-Check." },
  { title: "Kurse starten", text: "Termine live schalten, Marketing aktivieren, Teilnehmer empfangen." },
];

export default async function PartnerWerdenPage() {
  const seo = await fetchSeoForPage(defaults);
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />

      {/* Hero */}
      <header className="relative overflow-hidden bg-black text-white h-[55vh] sm:h-[60vh] min-h-[45vh] -mt-[5.5rem] sm:-mt-[5.5rem]">
        <div className="absolute inset-0 pointer-events-none">
          <picture>
            <source srcSet="https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/294c5a55-6a6e-449f-85a6-23e9ecc0db03.webp" />
            <img
              src="https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/294c5a55-6a6e-449f-85a6-23e9ecc0db03.webp"
              alt=""
              className="h-full w-full object-cover opacity-80"
              loading="eager"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/20" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <div className="relative z-10 mx-auto max-w-4xl space-y-5 drop-shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Music Mission Institute</p>
            <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">{seo.h1}</h1>
            <p className="text-base sm:text-lg text-white/85 leading-relaxed">
              {seo.heroSubline ||
                "Nutze dein Studio besser – wir bringen die Teilnehmer. Music Mission verwandelt freie Slots in planbare Kursformate mit Marketing, Plattform und Struktur. Du konzentrierst dich auf Praxis und Sound."}
            </p>
            {/* CTA im Hero entfernt auf Wunsch */}
          </div>
        </div>
      </header>

      {/* Intro + Wer wir suchen */}
      <section className="bg-white px-6 py-12 sm:py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Partner werden</p>
            <h2 className="font-anton text-3xl sm:text-4xl text-slate-900">Nutze dein Studio besser – wir bringen die Teilnehmer</h2>
            <p className="max-w-4xl text-slate-700">
              Viele Tonstudios und Branchenprofis haben freie Zeitfenster. Wir verwandeln diese Slots in kompakte Kursformate mit Teilnehmern, Marketing und klarer Struktur. Du wirst Teil eines wachsenden Netzwerks aus Produzenten, Toningenieuren, DJs und Kreativprofis, die ihr Wissen praxisnah weitergeben und ihre Kapazitäten besser auslasten.
            </p>
            <p className="max-w-4xl text-slate-700">
              Wir kümmern uns um Plattform, Struktur, Marketing und Organisation – du bringst deine Praxis und Erfahrung ein.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Wen wir suchen</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {focusAreas.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_-22px_rgba(0,0,0,0.18)]">
                  <p className="font-semibold text-slate-900">{item}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-600">Wenn du in einem dieser Bereiche professionell tätig bist und dein Wissen weitergeben möchtest, passt du perfekt in unser Netzwerk.</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-[#f5f6f8] px-6 py-14 sm:py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Warum sich das lohnt</p>
            <h2 className="font-anton text-3xl sm:text-4xl text-slate-900">Mehr Auslastung, weniger Aufwand</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_40px_-26px_rgba(0,0,0,0.2)]">
                <p className="text-sm font-semibold text-[#e0007a] uppercase tracking-[0.08em] mb-2">{b.title}</p>
                <p className="text-slate-800 leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white px-6 py-12 sm:py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">In 4 Schritten</p>
            <h2 className="font-anton text-3xl sm:text-4xl text-slate-900">So wirst du Partner</h2>
          </div>
          <div className="grid gap-4">
            {steps.map((s, idx) => (
              <div key={s.title} className="flex gap-3 rounded-2xl bg-[#f8f9fb] border border-slate-200 p-4 shadow-sm">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white font-semibold">{idx + 1}</div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">{s.title}</p>
                  <p className="text-slate-700">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="partner-form" className="bg-[#f5f6f8] px-6 py-12 sm:py-16 sm:px-10 lg:px-16 scroll-mt-28">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_18px_60px_-36px_rgba(0,0,0,0.18)]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-600">Bereit?</p>
            <h3 className="font-anton text-3xl text-slate-900">Werde Teil des Music Mission Netzwerks</h3>
            <p className="text-slate-700 max-w-3xl">
              Wir bauen eine moderne Ausbildungsplattform für Musikproduktion, Audio, DJing und kreative Medien – gemeinsam mit erfahrenen Branchenprofis. Wenn du dein Wissen teilen und dein Studio besser auslasten möchtest, freuen wir uns auf deine Anfrage.
            </p>
          </div>
          <form className="mt-8 grid gap-3 sm:grid-cols-2" action="mailto:office@musicmission.at" method="post" encType="text/plain">
            <label className="space-y-1 text-sm text-slate-700">
              Studio oder Firmenname *
              <input required name="studio" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30" />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              Ansprechpartner *
              <input required name="ansprechpartner" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30" />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              Telefon *
              <input required name="telefon" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30" />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              E-Mail *
              <input required type="email" name="email" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30" />
            </label>
            <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
              Straße / Nr. *
              <input required name="strasse" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30" />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              PLZ *
              <input required name="plz" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30" />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              Ort *
              <input required name="ort" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30" />
            </label>
            <PartnerCountryStateSelect />
            <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
              Referenzen (optional)
              <textarea name="referenzen" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30" />
            </label>
            <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
              Welche Kurse könnte ich anbieten? (optional)
              <textarea name="kurse" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30" />
            </label>
            <label className="sm:col-span-2 flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-slate-300 text-[#ff1f8f] focus:ring-[#ff1f8f]" name="rechtliches" />
              <span>Ich bestätige die rechtlichen Hinweise und die Verarbeitung meiner Daten zur Kontaktaufnahme. *</span>
            </label>
            <div className="sm:col-span-2 flex flex-wrap gap-3 pt-1">
              <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#ff1f8f] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#ff1f8f]/30 hover:bg-[#e0007a]">
                Anfrage senden
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
