import { SiteHeader } from "@/components/SiteHeader";

const highlights = [
  {
    title: "Studio statt Bildschirm",
    description:
      "Wir öffnen das GOSH! Studio in Wien und zeigen dir, wie unsere Extrem- und Intensivkurse wirklich laufen – echtes Gear, echte Coaches, keine Folien-Show.",
  },
  {
    title: "Kurse zum Anfassen",
    description:
      "Teste die Kursmethodik live, erlebe die Learning-Stations, lass dich von Teilnehmer-Erlebnissen inspirieren und finde heraus, welcher Kurs zu dir passt.",
  },
  {
    title: "Netzwerk & Klarheit",
    description:
      "Triff das Team, lerne Partnerstudios kennen und kläre Bezahlung, Ablauf und Restzahlung auf Augenhöhe – damit du sofort weißt, was als Nächstes passiert.",
  },
];

const program = [
  { time: "15:00", title: "Empfang & Studio-Rundgang", detail: "Einführung, Studiotour und Vorstellung der Kursabläufe." },
  { time: "15:40", title: "Live-Einblick & Q&A", detail: "Coaches zeigen Kursinhalte an echten Sessions und beantworten deine Fragen." },
  { time: "16:20", title: "Individual Check-Ins", detail: "Kurze Gespräche zur Kurswahl, Finanzierung und nächsten Schritten." },
];

export const metadata = {
  title: "Tag der offenen Tür · GOSH! Studio Wien | Music Mission Institute",
  description:
    "10. April 2026: Tag der offenen Tür im GOSH! Studio Wien. Erlebe Intensivkurse, spreche mit Coaches und sichere dir deinen Platz beim Music Mission Institute.",
};

export default function TagDerOffenenTuerPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <main className="space-y-16">
        <section className="relative overflow-hidden bg-slate-900 text-white">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900 to-slate-900" />
          <div className="absolute left-[-10%] top-0 h-72 w-72 rounded-full bg-pink-500/30 blur-3xl" />
          <div className="relative mx-auto max-w-6xl space-y-8 px-6 py-16 lg:px-12">
            <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.28em] text-white/70">Tag der offenen Tür</p>
                <h1 className="text-4xl font-semibold leading-tight md:text-5xl">GOSH! Studio Wien – live erleben</h1>
                <p className="max-w-3xl text-lg text-white/80">
                  Am 10. April 2026 öffnet das Music Mission Institute die Türen für einen Studio-Tag voller Kurs-Einblicke,
                  persönlicher Gespräche und klarer Antworten rund um unsere Intensiv- und Extremformate.
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full border border-white/30 bg-white/5 px-4 py-2 font-semibold">10. April 2026</span>
                  <span className="rounded-full border border-white/30 bg-white/5 px-4 py-2 font-semibold">15:00–17:00 Uhr</span>
                  <span className="rounded-full border border-white/30 bg-white/5 px-4 py-2 font-semibold">GOSH! Studio · Wien</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="#anmeldung"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#f3f3f3]"
                  >
                    Jetzt Platz reservieren
                  </a>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=gosh+studio+wien"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:border-white"
                  >
                    Studio anschauen
                    <span aria-hidden>↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="anmeldung" className="px-6 pb-24 pt-16 lg:px-12">
          <div className="mx-auto max-w-3xl space-y-10 rounded-[40px] border border-slate-200/80 bg-slate-50 px-8 py-12 shadow-[0_25px_50px_-30px_rgba(15,23,42,0.8)]">
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Bereit?</p>
              <h2 className="text-3xl font-semibold text-slate-900">Werde Teil des Music Mission Netzwerks</h2>
              <p className="text-base text-slate-600">
                Sag uns kurz, wer du bist, und wir reservieren dir einen Platz am Tag der offenen Tür. Du bekommst eine
                persönliche Bestätigung mit allen Details.
              </p>
            </div>
            <form
              action="mailto:office@musicmission.at?subject=Anmeldung%20Tag%20der%20offenen%20T%C3%BCr%20Wien&body=Name%3A%0AZusatz%3A%0AE-Mail%3A%0ATelefon%3A%0AKurs%20Interesse%3A"
              method="post"
              encType="text/plain"
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm text-slate-600">
                  Vorname *
                  <input
                    name="Vorname"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-600">
                  Nachname *
                  <input
                    name="Nachname"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm text-slate-600">
                  E-Mail *
                  <input
                    type="email"
                    name="Email"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-600">
                  Telefon *
                  <input
                    name="Telefon"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  />
                </label>
              </div>
              <label className="space-y-1 text-sm text-slate-600">
                Kurs-Interesse
                <input
                  name="Kurs Interesse"
                  placeholder="z. B. Intensivkurs Music Production"
                  className="w-full rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-600">
                Anmerkung
                <textarea
                  name="Anmerkung"
                  rows={3}
                  placeholder="Was möchtest du live testen oder wissen?"
                  className="w-full rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                />
              </label>
              <p className="text-xs text-slate-500">* Pflichtfelder. Wir melden uns innerhalb von 24 Stunden zurück.</p>
              <button
                type="submit"
                className="w-full rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-pink-500"
              >
                Anfrage senden
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
