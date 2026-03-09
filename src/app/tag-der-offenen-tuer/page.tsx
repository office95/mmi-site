import { SiteHeader } from "@/components/SiteHeader";

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
          <div className="pointer-events-none absolute right-[-6rem] top-0 h-80 w-80 rounded-full bg-pink-500/30 blur-[120px]" />
          <div className="relative z-10 mx-auto max-w-5xl space-y-10 px-6 py-16 lg:px-12">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.32em] text-white/60">Tag der offenen Tür</p>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">GOSH! Studio Wien · Live erleben</h1>
              <p className="max-w-3xl text-lg text-white/80 space-y-3">
                <span>Music Mission Institute &amp; Gosh! Audio laden zum Tag der offenen Tür ein.</span>
                <span>GOSH! Studio Wien · Einblick in die Praxis.</span>
                <span className="block mt-4">
                  Am 10. April öffnen wir die Türen des GOSH! Studios Wien. Lerne unsere Dozenten kennen, besichtige das Studio und
                  informiere dich umfassend über unsere Extrem- und Intensivkurse.
                </span>
                <span>
                  Erhalte Einblicke in Inhalte, Ablauf und Möglichkeiten der Ausbildung – und finde heraus, welcher Kurs zu dir passt.
                </span>
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-white/30 bg-white/5 px-4 py-2 font-semibold">10. April 2026</span>
                <span className="rounded-full border border-white/30 bg-white/5 px-4 py-2 font-semibold">15:00–17:00 Uhr</span>
                <span className="rounded-full border border-white/30 bg-white/5 px-4 py-2 font-semibold">Leystraße 43 · 1200 Wien</span>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 pt-16 lg:px-12" id="anmeldung">
          <div className="mx-auto max-w-3xl space-y-8 rounded-[40px] border border-slate-200/80 bg-white px-8 py-12 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.8)]">
              <div className="space-y-3 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Bereit?</p>
                <h2 className="text-3xl font-semibold text-slate-900">Jetzt anmelden</h2>
                <p className="text-base text-slate-600">
                  Melde dich jetzt kostenlos zum Tag der offenen Tür des Music Mission Instituts im GOSH! Studio Wien an.
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
