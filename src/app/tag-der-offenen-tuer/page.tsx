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
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900/80" />
          <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-pink-500/30 blur-[120px]" />
          <div className="relative z-10 mx-auto max-w-6xl grid gap-10 px-6 py-16 lg:grid-cols-[1.35fr_0.95fr] lg:px-12">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.32em] text-white/60">Tag der offenen Tür</p>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">GOSH! Studio Wien · Live erleben</h1>
              <p className="max-w-3xl text-lg text-white/80">
                Am 10. April öffnen wir das GOSH! Studio in Wien für einen exklusiven Einblick in die Intensiv- und Extremkurse von Music Mission.
                Lerne das Studio, die Coaches und das Kursformat kennen – inklusive Praxis & persönlicher Beratung.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-white/30 bg-white/5 px-4 py-2 font-semibold">10. April 2026</span>
                <span className="rounded-full border border-white/30 bg-white/5 px-4 py-2 font-semibold">15:00–17:00 Uhr</span>
                <span className="rounded-full border border-white/30 bg-white/5 px-4 py-2 font-semibold">Leystraße 43 · 1200 Wien</span>
              </div>
            </div>
            <div className="rounded-[32px] border border-white/20 bg-white/10 p-6 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.65)] backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Live vor Ort</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">Studio & Coaches</h2>
              <p className="mt-2 text-sm text-white/70">
                Workflows auf echtem Gear, kuratiertes Coaching und klare Zahlungslogik mit Anzahlung und Rest zum Kursstart.
              </p>
              <div className="mt-6 space-y-3 text-xs uppercase tracking-[0.3em] text-white/60">
                <p>Limitierte Plätze · Anmeldung erforderlich</p>
                <p>Hands-on Sessions · Persönliche Betreuung</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-12 lg:px-12">
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="text-center space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-pink-500">Warum Teilnehmen?</p>
              <h2 className="text-3xl font-semibold text-slate-900">Erlebe, wie echte Studio-Workflows funktionieren</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {highlights.map((item) => (
                <article key={item.title} className="rounded-[32px] border border-slate-200/70 bg-white/80 p-6 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.65)]">
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 pt-16 lg:px-12" id="anmeldung">
          <div className="mx-auto grid max-w-6xl gap-10 rounded-[40px] border border-slate-200/80 bg-slate-50 px-8 py-12 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.8)] lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Bereit?</p>
                <h2 className="text-3xl font-semibold text-slate-900">Sichere dir deinen Platz</h2>
                <p className="text-base text-slate-600">
                  Sag uns, wer du bist und welche Kurse dich interessieren – wir melden uns mit allen Details zurück.
                </p>
                <div className="space-y-4 text-sm text-slate-600">
                  {program.map((step) => (
                    <div key={step.time} className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/60 px-4 py-3">
                      <span className="text-xs uppercase tracking-[0.3em] text-pink-600">{step.time}</span>
                      <div>
                        <p className="font-semibold text-slate-900">{step.title}</p>
                        <p className="text-sm text-slate-600">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-600">
                  Nachname *
                  <input
                    name="Nachname"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
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
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-600">
                  Telefon *
                  <input
                    name="Telefon"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  />
                </label>
              </div>
              <label className="space-y-1 text-sm text-slate-600">
                Kurs-Interesse
                <input
                  name="Kurs Interesse"
                  placeholder="z. B. Intensivkurs Music Production"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-600">
                Anmerkung
                <textarea
                  name="Anmerkung"
                  rows={3}
                  placeholder="Was möchtest du live testen oder wissen?"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                />
              </label>
              <p className="text-xs text-slate-500">* Pflichtfelder.</p>
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
