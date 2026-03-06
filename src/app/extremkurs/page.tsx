import { SiteHeader } from "@/components/SiteHeader";
import ConsultBanner from "@/components/ConsultBanner";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { headers } from "next/headers";
import { getRegion } from "@/lib/region";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import type { Metadata } from "next";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const SITE_AT = process.env.NEXT_PUBLIC_DOMAIN_AT || process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at";
const SITE_DE = process.env.NEXT_PUBLIC_DOMAIN_DE || "https://musicmission.de";

export const metadata: Metadata = {
  title: "Extremkurse | Music Mission Institute",
  description: "Kurz, hart, maximal praxisnah: Extremkurse in Musikproduktion und Tontechnik in AT & DE.",
  alternates: {
    canonical: "/extremkurs",
    languages: {
      "de-AT": `${SITE_AT}/extremkurs`,
      "de-DE": `${SITE_DE}/extremkurs`,
      "x-default": `${SITE_AT}/extremkurs`,
    },
  },
  openGraph: {
    title: "Extremkurse | Music Mission Institute",
    description: "Intensive Kurzformate für Musikproduktion & Live-Sound – mit Top-Dozenten in DACH.",
    url: "/extremkurs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Extremkurse | Music Mission Institute",
    description: "Extremkurse mit maximaler Praxis in Musikproduktion & Tontechnik.",
  },
};

type Course = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  hero_image_url?: string | null;
  hero_image_mobile_url?: string | null;
  base_price_cents?: number | null;
};

async function loadCourses(region: "AT" | "DE"): Promise<Course[]> {
  const supabase = getSupabaseServiceClient();

  const regionOr = `region.eq.${region},region.eq.${region.toLowerCase()},region.is.null,region.eq.`; // allow null/empty/case-insensitive

  const { data: type } = await supabase
    .from("course_types")
    .select("id")
    .ilike("name", "%extrem%")
    .or(regionOr)
    .maybeSingle();
  if (!type?.id) return [];

  const { data } = await supabase
    .from("courses")
    .select("id,title,slug,summary,hero_image_url,hero_image_mobile_url,base_price_cents")
    .eq("type_id", type.id)
    .or(regionOr)
    .order("title", { ascending: true });

  return data ?? [];
}

export default async function ExtremkursPage() {
  const hdr = await headers();
  const host = (hdr.get("x-forwarded-host") || hdr.get("host") || "").toLowerCase();
  const region: "AT" | "DE" = host.endsWith(".de") ? "DE" : host.endsWith(".at") ? "AT" : getRegion();

  const courses = await loadCourses(region);
  const heroVideo = "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/3fb0f96e-9ba1-4d7b-b2ba-c3a30fb4ecff.mp4";
  const heroFallback =
    courses[0]?.hero_image_url ??
    "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/hero/hero/6f1c4742-87d8-4c7a-b577-f94f72654c93.jpg";

  const videoUrl =
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"; // Platzhalter, kann durch Vimeo/Supabase-Video ersetzt werden

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />

      {/* Hero */}
      <section className="relative h-[65vh] w-full overflow-hidden text-white">
        <video
          src={heroVideo}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover hero-float"
        />
        {/* Fallback Image if video fails */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroFallback} alt="Extremkurse" className="h-full w-full object-cover opacity-0" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/35 to-black/10" />
        <div className="absolute inset-0 flex items-center px-6 lg:px-16">
          <div className="max-w-4xl space-y-4 drop-shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
            <p className="text-sm uppercase tracking-[0.24em] text-white/80">Kurstyp</p>
            <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl leading-tight">Extremkurse</h1>
            <p className="max-w-2xl text-base sm:text-lg text-white/90">
              Maximales Wissen in kurzer Zeit. Unsere Extremkurse richten sich an alle, die in kürzester Zeit das Maximum aus sich und ihrer Musikproduktion herausholen wollen.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#kurse"
                className="rounded-full bg-[#ff1f8f] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/40 hover:-translate-y-0.5 transition"
              >
                Kurse ansehen
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Intro Text */}
      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-18 space-y-10">
        <div className="rounded-[32px] border border-slate-200 bg-white/80 backdrop-blur shadow-xl shadow-slate-200/60 p-6 sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:gap-12 lg:grid-cols-[1.1fr_0.9fr] items-start">
            <Reveal>
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.18em] text-pink-600">Extremkurse</p>
                <h2 className="font-anton text-3xl sm:text-4xl text-slate-900 leading-tight">Kompakt. Praxisnah. Effektiv.</h2>
                <p className="text-slate-600 text-base leading-relaxed">
                  Unsere Extremkurse stehen für maximalen Wissenstransfer in kürzester Zeit. In einem kompakten Format vermitteln wir dir genau die Inhalte, die du brauchst, um sofort
                  produktiv arbeiten zu können – ohne Umwege, ohne Zeitverlust.
                </p>
                <p className="text-slate-600 text-base leading-relaxed">
                  Ob Musikproduktion, Audio Engineering, DJing oder spezialisierte Themenbereiche: Der Fokus liegt zu 100&nbsp;% auf der Praxis. Du arbeitest direkt an realen Projekten, mit
                  professionellem Equipment und unter Anleitung aktiver Branchenprofis.
                </p>
              </div>
            </Reveal>
            <div className="space-y-4">
              <Reveal delay={80}>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-slate-900 mb-2">Für wen ideal?</p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {[
                      "Berufstätige mit begrenztem Zeitbudget",
                      "Schüler:innen und Studierende",
                      "Homestudio-Produzenten",
                      "Musiker:innen, Bands und DJs",
                      "Content-Creator und Podcaster",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#ff1f8f]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <Reveal delay={160}>
                <div className="rounded-2xl bg-slate-900 text-white p-4 sm:p-5 shadow-lg shadow-slate-900/25">
                  <p className="text-sm font-semibold mb-2 text-white/90">Dein Vorteil</p>
                  <ul className="space-y-2 text-sm text-white/85">
                    {[
                      "9–32 Stunden geballtes Fachwissen",
                      "Kleine Gruppen & persönliche Betreuung",
                      "Hochverdichtete Inhalte mit starkem Praxisbezug",
                      "Sofort anwendbare Skills",
                      "Preislich besonders zugänglich",
                    ].map((v) => (
                      <li key={v} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white" />
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-white/80">
                    Perfekt für alle, die effizient lernen und schnell Ergebnisse sehen möchten.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Kurs-Grid */}
      <section id="kurse" className="mx-auto max-w-6xl px-6 pb-16 space-y-6 scroll-mt-32 lg:scroll-mt-40">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Kurse</p>
          <h2 className="font-anton text-3xl text-slate-900">Alle Extremkurse</h2>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-600">
            Noch keine Extremkurse veröffentlicht. Schau bald wieder vorbei!
          </div>
        ) : (
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c, idx) => (
              <Reveal key={c.id} delay={idx * 80}>
                <article
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    {c.hero_image_url ? (
                      <Image
                        src={c.hero_image_url}
                        alt={c.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400 text-sm">Kein Bild</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col space-y-3 p-4">
                    <h3 className="font-anton text-xl leading-tight text-slate-900">{c.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-3">{c.summary ?? "Mehr Infos bald verfügbar."}</p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      <Link
                        href={`/kurs/${c.slug}`}
                        className="inline-flex rounded-full bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e40073] transition"
                      >
                        Mehr Infos
                      </Link>
                      <Link
                        href={`/entdecken?course=${encodeURIComponent(c.slug)}`}
                        className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition"
                      >
                        Buchen
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Claim Banner (100vh, ersetzt Video) */}
      <section className="relative isolate sticky top-0 z-20 flex h-[100vh] w-full items-center justify-center overflow-hidden bg-[#060b14] px-4 py-10">
        <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(113,96,255,0.35),transparent_35%),radial-gradient(circle_at_80%_50%,rgba(255,122,45,0.28),transparent_38%),radial-gradient(circle_at_50%_10%,rgba(30,144,255,0.35),transparent_34%)]" />
        </div>
        <div className="relative mx-auto max-w-6xl text-center space-y-6">
          <p className="text-lg sm:text-xl font-semibold text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)]">
            Perfekt für Berufstätige, Schüler und Studenten.
          </p>
          <h2
            className="font-anton text-[42px] leading-[1.05] sm:text-[54px] md:text-[72px] lg:text-[86px] xl:text-[96px] tracking-tight drop-shadow-[0_10px_40px_rgba(0,0,0,0.55)]"
            style={{
              backgroundImage: "linear-gradient(90deg,#1e90ff 0%,#6b63ff 30%,#f2418f 60%,#ff7a2d 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Lerne schneller, smarter – und günstiger als je zuvor.
          </h2>
        </div>
      </section>

      {/* Beratung + Footer */}
      <ConsultBanner overlapOffset={0} height="70vh" />
    </div>
  );
}
