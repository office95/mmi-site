import Image from "next/image";
import Link from "next/link";
import { ComingSoonMarquee } from "./ComingSoonMarquee";

export const dynamic = "force-dynamic";

const LOGO =
  process.env.NEXT_PUBLIC_SITE_LOGO_URL ||
  "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/333eb4c4-56a9-4396-bc74-4448da17ce14.webp";

export default function DeComingSoonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#111827] to-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,31,143,0.2),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.08),transparent_30%)]" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-6 sm:px-10 py-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src={LOGO} alt="Music Mission Logo" width={54} height={54} className="h-12 w-12 object-contain drop-shadow-lg" priority />
            <span className="font-semibold tracking-tight text-white/90 hidden sm:inline">Music Mission Institute</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-pink-300 hover:text-pink-200">
            Zur AT-Seite
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-14 text-center gap-8">
          <div className="space-y-4 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-pink-200">Germany Launch</p>
            <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl leading-tight text-white drop-shadow-lg">
              Wir sind in Kürze auch in Deutschland für dich da.
            </h1>
            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
              Intensive Ausbildungen, Extremkurse und Top-Studios kommen nach Deutschland. Trag dich ein und erfahre als Erste:r, wenn dein Bundesland startet.
            </p>
          </div>

          <ComingSoonMarquee />

          <div className="mt-6">
            <Link
              href="https://musicmission.at/newsletter"
              className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-600/30 hover:-translate-y-0.5 transition"
            >
              Notify me
            </Link>
          </div>
        </main>

        <footer className="py-6 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Music Mission Institute · Österreich / Deutschland
        </footer>
      </div>
    </div>
  );
}
