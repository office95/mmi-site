import Link from "next/link";

const actions = [
  { href: "/", label: "Zur Startseite" },
  { href: "/entdecken", label: "Kurse entdecken" },
  { href: "/beratung", label: "Beratung vereinbaren" },
];

export default function NotFound() {
  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-white via-[#fff2f9] to-white text-slate-900 px-5 sm:px-10 py-16">
      <div className="mx-auto max-w-4xl grid gap-10 sm:gap-12 items-center text-center">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-[#ff1f8f] font-semibold">404 – Seite nicht gefunden</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Oops, dieser Link führt ins Leere.</h1>
          <p className="text-base sm:text-lg text-slate-600">
            Die angeforderte Seite gibt es nicht (mehr). Wähle eine der Optionen unten oder nutze das Menü, um weiter zu stöbern.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {actions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center justify-center rounded-full bg-[#ff1f8f] px-5 sm:px-6 py-3 text-white font-semibold shadow-lg shadow-[#ff1f8f]/30 hover:translate-y-[-1px] hover:shadow-[#ff1f8f]/40 transition"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-white/70 bg-white shadow-[0_20px_60px_rgba(255,31,143,0.12)] px-6 sm:px-10 py-8 text-left">
          <h2 className="text-xl font-semibold mb-3">Schnelle Hilfe</h2>
          <ul className="space-y-2 text-slate-700 text-sm sm:text-base list-disc list-inside">
            <li>Hast du einen alten Link aus einer E-Mail? Prüfe unsere aktuellen Kurse unter „Entdecken“.</li>
            <li>Bei Buchungen: gehe direkt zu <Link href="/buchen" className="underline underline-offset-4 text-[#ff1f8f]">/buchen</Link> und wähle deinen Termin.</li>
            <li>Für individuelle Fragen melde dich über <Link href="/beratung" className="underline underline-offset-4 text-[#ff1f8f]">/beratung</Link>.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
