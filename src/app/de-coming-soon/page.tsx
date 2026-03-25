import Image from "next/image";
import Link from "next/link";
import { ComingSoonMarquee } from "./ComingSoonMarquee";
import { ComingSoonSlider } from "./ComingSoonSlider";

export const dynamic = "force-dynamic";

const LOGO = "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/b153f4b8-0e72-4b4c-bdb8-8d75a37f95d3.webp";

export default function DeComingSoonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#111827] to-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,31,143,0.2),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.08),transparent_30%)]" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-6 sm:px-10 py-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src={LOGO} alt="Music Mission Logo" width={120} height={120} className="h-20 w-20 object-contain drop-shadow-lg" priority />
            <span className="font-semibold tracking-tight text-white/90 hidden sm:inline">Music Mission Institute</span>
          </Link>
          <Link href="https://musicmission.at" className="text-sm font-semibold text-pink-300 hover:text-pink-200">
            Zur AT-Seite
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-14 text-center gap-8">
          <div className="space-y-4 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-pink-200">Germany Launch</p>
            <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl leading-tight text-white drop-shadow-lg">
              Wir sind in Kürze auch in Deutschland für dich da.
            </h1>
          </div>

          <div className="w-full max-w-5xl space-y-4">
            <ComingSoonSlider />
            <ComingSoonMarquee />
          </div>

        </main>

        <footer className="py-6 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Music Mission Institute · Österreich / Deutschland
        </footer>
      </div>
    </div>
  );
}
