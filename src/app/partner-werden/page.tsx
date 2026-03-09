import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Partner werden | Music Mission Institute",
  description:
    "Nutze dein Studio besser – wir bringen Teilnehmer, Marketing und Kursstruktur. Werde Partner im Music Mission Netzwerk.",
  alternates: { canonical: "/partner-werden" },
  openGraph: {
    title: "Partner werden | Music Mission Institute",
    description: "Studio-Auslastung erhöhen, Marketing-Power nutzen, praxisnahe Kurse hosten – gemeinsam mit dem Music Mission Institute.",
    url: "/partner-werden",
    type: "website",
  },
};

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
    text: "Wir füllen freie Studio-Slots mit klaren Formaten: Extremkurse (kurz & intensiv) und Intensivkurse (strukturiert & vertiefend).",
  },
  {
    title: "Marketing-Power inklusive",
    text: "Kampagnen, Social Media, Online-Präsenz, Teilnehmermanagement, Buchungs- & Zahlungsabwicklung laufen über MMI.",
  },
  {
    title: "Professionelle Kursinfrastruktur",
    text: "Lehrpläne, Skripte, Dozentenleitfäden, Plattform und unser Trainer:innen-Pool – ready to go.",
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

export default function PartnerWerdenPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />

      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-black via-slate-900 to-[#0b0b12] text-white">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,#ff1f8f,transparent_30%),radial-gradient(circle_at_80%_10%,#7c3aed,transparent_32%),radial-gradient(circle_at_60%_75%,#ff1f8f,transparent_30%)]" />
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-14 pt-24 sm:px-10 sm:pb-16 sm:pt-28 lg:px-16 lg:pb-20">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Music Mission Institute</p>
          <div className="space-y-3">
            <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">Partner werden</h1>
            <p className="max-w-3xl text-base sm:text-lg text-white/85 leading-relaxed">
              Nutze dein Studio besser – wir bringen die Teilnehmer. Music Mission verwandelt freie Slots in planbare Kursformate mit Marketing, Plattform und Struktur. Du konzentrierst dich auf Praxis und Sound.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="mailto:office@musicmission.at?subject=Partner werden"
              className="inline-flex items-center gap-2 rounded-full bg-[#ff1f8f] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#ff1f8f]/30 hover:bg-[#e0007a]"
            >
              Jetzt anfragen
              <span aria-hidden>→</span>
            </Link>
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
      <section className="bg-[#f5f6f8] px-6 py-12 sm:py-16 sm:px-10 lg:px-16">
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
            <label className="space-y-1 text-sm text-slate-700">
              Land *
              <select name="land" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30" required>
                <option>Österreich</option>
                <option>Deutschland</option>
              </select>
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              Bundesland *
              <select name="bundesland" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30" required>
                <optgroup label="Österreich">
                  <option>Burgenland</option>
                  <option>Kärnten</option>
                  <option>Niederösterreich</option>
                  <option>Oberösterreich</option>
                  <option>Salzburg</option>
                  <option>Steiermark</option>
                  <option>Tirol</option>
                  <option>Vorarlberg</option>
                  <option>Wien</option>
                </optgroup>
                <optgroup label="Deutschland">
                  <option>Baden-Württemberg</option>
                  <option>Bayern</option>
                  <option>Berlin</option>
                  <option>Brandenburg</option>
                  <option>Bremen</option>
                  <option>Hamburg</option>
                  <option>Hessen</option>
                  <option>Mecklenburg-Vorpommern</option>
                  <option>Niedersachsen</option>
                  <option>Nordrhein-Westfalen</option>
                  <option>Rheinland-Pfalz</option>
                  <option>Saarland</option>
                  <option>Sachsen</option>
                  <option>Sachsen-Anhalt</option>
                  <option>Schleswig-Holstein</option>
                  <option>Thüringen</option>
                </optgroup>
              </select>
            </label>
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
