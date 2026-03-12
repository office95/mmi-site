import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getRegion } from "@/lib/region";
import { fetchSeoForPage, resolvedSeoToMetadata } from "@/lib/seo-matrix";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const defaults = {
  pageKey: "standorte",
  defaultSlug: "/standorte",
  defaultTitle: "Standorte | Music Mission Institute",
  defaultDescription: "Unsere Partner-Standorte für Kurse in Musikproduktion, Tontechnik, Live-Sound und DJing.",
  defaultH1: "Unsere Partner-Standorte",
};

export async function generateMetadata() {
  const seo = await fetchSeoForPage(defaults);
  return resolvedSeoToMetadata(seo);
}

export default async function StandortePage() {
  const seo = await fetchSeoForPage(defaults);
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
              {seo.h1}
            </h1>
            {seo.heroSubline ? <p className="text-base text-white/85 max-w-3xl">{seo.heroSubline}</p> : null}
          </div>
        </section>
        {/* Weitere Abschnitte folgen */}
      </main>
    </div>
  );
}
