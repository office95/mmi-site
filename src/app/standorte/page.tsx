import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getRegion } from "@/lib/region";
import type { Metadata } from "next";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Standorte | Music Mission Institute",
  description: "Unsere Partner-Standorte für Kurse in Musikproduktion, Tontechnik, Live-Sound und DJing.",
  alternates: { canonical: "/standorte" },
  openGraph: {
    title: "Standorte | Music Mission Institute",
    description: "Partner-Studios und Locations in AT & DE für deine Music-Mission-Kurse.",
    url: "/standorte",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Standorte | Music Mission Institute",
    description: "Alle Partner-Standorte für Music Mission Kurse in DACH.",
  },
};

export default async function StandortePage() {
  const region = await getRegion();
  const supabase = getSupabaseServiceClient();
  const { data: partners } = await supabase
    .from("partners")
    .select("id,name,slug,hero1_path,region")
    .or(`region.eq.${region},region.eq.${region.toLowerCase()},region.is.null,region.eq.`)
    .not("hero1_path", "is", null)
    .limit(1);

  const hero = partners?.[0]?.hero1_path || "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1600&q=80";

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative h-[60vh] w-full overflow-hidden bg-black">
          <Image src={hero} alt="Standorte" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70" />
          <div className="absolute bottom-10 left-6 sm:left-12 text-left space-y-2">
            <p className="text-sm uppercase tracking-[0.22em] text-white/70">Standorte</p>
            <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl text-white leading-tight drop-shadow-lg">
              Unsere Partner-Standorte
            </h1>
          </div>
        </section>
        {/* Weitere Abschnitte folgen */}
      </main>
    </div>
  );
}
