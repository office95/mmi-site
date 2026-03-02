import { SiteHeader } from "@/components/SiteHeader";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />

      <header className="relative overflow-hidden text-white">
        {/* Hauptverlauf: oben tiefes Schwarz, nach unten weicher Übergang in Footer-Pink */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,31,143,0.18),transparent_35%),linear-gradient(180deg,#050505_0%,#0b0710_35%,#ff1f8f_115%)]" />
        {/* Glows für Tiefe */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,31,143,0.32),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(255,74,170,0.24),transparent_30%),radial-gradient(circle_at_65%_78%,rgba(255,31,143,0.18),transparent_30%)] mix-blend-screen opacity-85" />
        {/* Schräges Lichtband */}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,31,143,0.16)_0%,rgba(255,31,143,0.05)_35%,transparent_60%),linear-gradient(-130deg,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0)_55%)]" />
        <div className="relative mx-auto max-w-5xl px-6 sm:px-10 lg:px-14 py-16 sm:py-20 space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/70">Rechtliches</p>
          <h1 className="font-anton text-4xl sm:text-5xl leading-tight">Impressum</h1>
          <p className="text-white/85 max-w-3xl">
            Informationen gemäß §5 ECG, §14 UGB, §63 GewO, §25 MedienG.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-14 py-12 sm:py-16 space-y-10">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Anbieter</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <p className="font-semibold">Music Mission GmbH</p>
            <p>Akazienweg 6</p>
            <p>9131 Grafenstein</p>
            <p className="pt-2">Geschäftsführer: Christian Hasenbichler</p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">Register & Rechtliches</h3>
            <p>UID: ATU80644028</p>
            <p>Firmenbuchnummer: FN 627518 x</p>
            <p>Gerichtsstand: Klagenfurt</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">Kontakt</h3>
            <p>
              Web:{" "}
              <a className="underline underline-offset-4 text-pink-600 hover:text-pink-700" href="https://www.musicmission.at" target="_blank" rel="noreferrer">
                www.musicmission.at
              </a>
            </p>
            <p>
              E-Mail:{" "}
              <a className="underline underline-offset-4 text-pink-600 hover:text-pink-700" href="mailto:office@musicmission.at">
                office@musicmission.at
              </a>
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">Online-Streitbeilegung</h3>
          <p className="text-slate-700">
            Information gemäß EU-Verordnung Art. 14 ODR-VO und §36 VSBG:
            Beschwerdeverfahren via Online-Streitbeilegung für Verbraucher (OS) unter{" "}
            <a className="underline underline-offset-4 text-pink-600 hover:text-pink-700" href="http://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer">
              http://ec.europa.eu/consumers/odr/
            </a>.
          </p>
          <p className="text-slate-700">
            Music Mission GmbH ist nicht bereit und nicht verpflichtet, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
          <h3 className="text-lg font-semibold text-slate-900">Concept & Website</h3>
          <p>Christian Hasenbichler</p>
        </section>
      </main>
    </div>
  );
}
