import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Partner werden | Music Mission Institute",
  description:
    "Werde Standort-Partner des Music Mission Institute. Fülle freie Studio-Slots, erhalte Marketing-Support und biete zertifizierte Kurse bei dir vor Ort an.",
  alternates: { canonical: "/partner-werden" },
  openGraph: {
    title: "Partner werden | Music Mission Institute",
    description: "Mit MMI als Partner: Studio-Auslastung erhöhen, Marketing nutzen, praxisnahe Kurse hosten.",
    url: "/partner-werden",
    type: "website",
  },
};

const benefits = [
  {
    title: "Mehr Auslastung, planbar",
    text: "Wir füllen deine freien Studio-Slots mit kompakten Kurs-Formaten (Intensiv & Extrem).",
  },
  {
    title: "Marketing-Power inklusive",
    text: "MMI-Kampagnen, Ads, Newsletter & Trustpilot-Reputation bringen Anfragen zu dir.",
  },
  {
    title: "Trainer-Pool & Curriculum",
    text: "Erprobte Kurskonzepte, Trainer aus der Praxis, klare Abläufe – fertig zum Start.",
  },
  {
    title: "Transparente Abrechnung",
    text: "Klare Revenue-Share, Reporting und automatisierte Buchungen via Stripe Checkout.",
  },
];

const steps = [
  { title: "Anfrage", text: "Kurzformular ausfüllen, wir melden uns innerhalb von 2 Werktagen." },
  { title: "Standort-Check", text: "Wir prüfen Raumgrößen, Akustik-Basics, Infrastruktur und Technik." },
  { title: "Onboarding", text: "Branding, Kurskalender, Pricing, Trainer-Zuteilung und Sicherheitbriefing." },
  { title: "Launch", text: "Kampagnen starten, Termine live schalten, erste Buchungen entgegennehmen." },
  { title: "Laufender Betrieb", text: "Teilnehmer vor Ort empfangen, wir kümmern uns um Buchung, Payment, Support & Reporting." },
];

const requirements = [
  "Regieraum + Aufnahmeraum oder großer Regieraum mit flexibler Bestuhlung",
  "Mind. 8–12 Sitzplätze, gute Belüftung/Klima, saubere Stromversorgung",
  "Grund-Setup: Audio-Interface, Abhöre, Mikrofone, Kopfhörer-Distribution",
  "Stabile Internetverbindung, Parkmöglichkeiten oder gute ÖPNV-Anbindung",
  "Terminslots an Wochenenden oder unter der Woche abends",
];

const faqs = [
  { q: "Wie läuft die Abrechnung?", a: "Buchung & Zahlung laufen über Stripe Checkout. Du erhältst monatliche Abrechnung/Reporting gemäß vereinbartem Share." },
  { q: "Wer stellt Trainer und Inhalte?", a: "Trainer kommen aus dem MMI-Pool. Curriculum, Ablauf und Teilnehmerunterlagen stellen wir bereit." },
  { q: "Was braucht mein Studio technisch?", a: "Saubere Abhöre, Interfaces, Mics, Monitoring, Strom & Internet. Details in unserer technischen Checkliste nach der Anfrage." },
  { q: "Wie schnell können wir starten?", a: "Nach Standort-Check und Onboarding typischerweise 3–6 Wochen bis zum ersten Termin." },
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
              Werde Standort-Partner und hoste MMI-Kurse direkt in deinem Studio. Wir liefern Curriculum, Trainer, Marketing & Buchungen – du fokussierst dich auf großartigen Sound vor Ort.
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
            <Link
              href="tel:+43422624600"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:border-white/60"
            >
              Direkt sprechen
            </Link>
          </div>
        </div>
      </header>

      {/* Benefits */}
      <section className="bg-white px-6 py-12 sm:py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Warum mit MMI</p>
            <h2 className="font-anton text-3xl sm:text-4xl text-slate-900">Starkes Netzwerk, klare Prozesse</h2>
            <p className="max-w-3xl text-slate-700">
              Wir kombinieren deine Infrastruktur mit unseren Kurskonzepten, Trainer:innen und Marketing. So wird dein Studio zum regionalen Hub für Musikproduktion, Tontechnik und DJing.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
      <section className="bg-[#f5f6f8] px-6 py-14 sm:py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ablauf</p>
            <h2 className="font-anton text-3xl text-slate-900">In fünf Schritten live</h2>
          </div>
          <div className="grid gap-4">
            {steps.map((s, idx) => (
              <div key={s.title} className="flex gap-3 rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
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

      {/* Requirements */}
      <section className="bg-white px-6 py-12 sm:py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Was wir brauchen</p>
            <h2 className="font-anton text-3xl text-slate-900">Voraussetzungen für deinen Standort</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {requirements.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_-22px_rgba(0,0,0,0.2)]">
                <p className="text-slate-800">{item}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-600">
            Ausführliche technische Checkliste senden wir nach deiner Anfrage zu.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-[#0f1116] text-white px-6 py-14 sm:py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-white/70">FAQ</p>
            <h2 className="font-anton text-3xl sm:text-4xl">Häufige Fragen von Partnern</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="font-semibold mb-2">{f.q}</p>
                <p className="text-white/85 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white px-6 py-12 sm:py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-gradient-to-r from-[#ff1f8f]/12 via-white to-[#7c3aed]/10 p-6 sm:p-8 shadow-[0_18px_60px_-36px_rgba(0,0,0,0.28)]">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-600">Bereit?</p>
            <h3 className="font-anton text-3xl text-slate-900">Lass uns deinen Standort starten</h3>
            <p className="text-slate-700 max-w-3xl">
              Schreib uns kurz zu deinem Studio, Standort und verfügbaren Terminslots. Wir melden uns mit einem kurzen Call-Vorschlag und schicken dir die technische Checkliste.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="mailto:office@musicmission.at?subject=Partner werden"
                className="inline-flex items-center gap-2 rounded-full bg-[#ff1f8f] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#ff1f8f]/30 hover:bg-[#e0007a]"
              >
                E-Mail senden
              </Link>
              <Link
                href="/beratung"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:border-slate-400"
              >
                Beratung buchen
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
