import { HeroSlider } from "@/components/HeroSlider";
import { FlyInCards } from "@/components/FlyInCards";
import { SiteHeader } from "@/components/SiteHeader";
import { FAQAccordion } from "@/components/FAQAccordion";
import ConsultBanner from "@/components/ConsultBanner";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Image from "next/image";
import CourseSearch from "@/components/CourseSearch";
import { getRegion } from "@/lib/region";
import { headers } from "next/headers";
import { PartnerMarqueeClient } from "@/components/PartnerMarqueeClient";
import { URL } from "node:url";
import Link from "next/link";
import CourseRail from "@/components/CourseRail";
import { fetchSeoForPage, resolvedSeoToMetadata } from "@/lib/seo-matrix";
import Script from "next/script";

const toUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://naobgnbpvqgutxsaphci.supabase.co";
  const clean = path.replace(/^\/+/, "");
  if (clean.startsWith("storage/v1/object/public/") || clean.startsWith("/storage/v1/object/public/")) {
    return `${base}/${clean.replace(/^\/+/, "")}`;
  }
  if (clean.startsWith("public/")) {
    return `${base}/storage/v1/object/${clean}`;
  }
  return `${base}/storage/v1/object/public/${clean}`;
};

const partnerLogos = [
  { src: "/logos/ableton.svg", alt: "Ableton" },
  { src: "/logos/akai.svg", alt: "Akai" },
  { src: "/logos/logic.svg", alt: "Logic" },
  { src: "/logos/pioneer.svg", alt: "Pioneer" },
  { src: "/logos/ssl.svg", alt: "SSL" },
  { src: "/logos/uaudio.svg", alt: "Universal Audio" },
];

type HomeFaq = { q: string; a: string | string[] };
type HomeCourse = { id: string; title: string; slug: string | null; hero: string | null; type: "Intensiv" | "Extrem" | "Kurs" };
type HomeSession = {
  id: string;
  start_date: string | null;
  start_time: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  price_cents: number | null;
  deposit_cents: number | null;
  courses: { title: string; slug: string | null } | null;
};

export const revalidate = 120;

const homeSeoDefaults = {
  pageKey: "homepage",
  defaultSlug: "/",
  defaultTitle: "Musikproduktion & Tontechnik | Music Mission Institute",
  defaultDescription:
    "Praxisnahe Kurse in Musikproduktion, Tontechnik, Live-Tontechnik, DJing & Vocalcoaching in Österreich und Deutschland. Lerne im Studio von Profis – jetzt Platz sichern.",
  defaultH1: "Musikproduktion & Tontechnik Kurse – Music Mission Institute",
};

export async function generateMetadata() {
  const seo = await fetchSeoForPage(homeSeoDefaults);
  return resolvedSeoToMetadata(seo);
}

export default async function Home() {
  const hdr = await headers();
  const get = (key: string) => {
    const anyH: any = hdr as any;
    if (typeof anyH.get === "function") return anyH.get(key) as string | null;
    return null;
  };
  const regionHeader = get("x-region")?.toUpperCase();
  const vercelHost = get("x-vercel-deployment-url") || "";
  const hostRaw = get("x-forwarded-host") || get("host") || vercelHost || "";
  const host = hostRaw.toLowerCase();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const siteHost = (() => {
    try {
      return siteUrl ? new URL(siteUrl).host.toLowerCase() : "";
    } catch {
      return "";
    }
  })();
  const cookieRegion = (() => {
    const ck = get("cookie") || "";
    const m = ck.match(/region=(DE|AT)/i);
    return m ? m[1].toUpperCase() : null;
  })();

  // HARDCODE fallback: wenn Domain musicmission.de → DE, musicmission.at → AT
  const targetHost = host || siteHost; // nur SiteHost nutzen, wenn Host leer (RSC ohne forwarded-host)
  const forcedRegion = targetHost.includes("musicmission.de") ? "DE" : targetHost.includes("musicmission.at") ? "AT" : null;

  const region =
    cookieRegion ??
    forcedRegion ??
    (regionHeader === "DE"
      ? "DE"
      : regionHeader === "AT"
      ? "AT"
      : host.endsWith(".de")
      ? "DE"
      : host.endsWith(".at")
      ? "AT"
      : await getRegion());
  const seo = await fetchSeoForPage(homeSeoDefaults);
  const supabase = getSupabaseServiceClient();
  const { data: heroRows } = await supabase
    .from("hero_slides")
    .select("image_url,title,subtitle,is_active,position,created_at")
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  // Partner laden (Filter passiert im Client anhand Host)
  const { data: partnerRows } = await supabase
    .from("partners")
    .select("name,slug,state,city,logo_path,country,region")
    .order("name", { ascending: true });
  const { data: faqRows } = await supabase
    .from("homepage_faqs")
    .select("question,answer,region,sort")
    .or(`region.is.null,region.eq.${region}`)
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });
  const { data: courseRows } = await supabase
    .from("courses")
    .select("id,title,slug,status,hero_image_url,type_id")
    .eq("status", "active")
    .order("created_at", { ascending: true });
  const today = new Date().toISOString().slice(0, 10);
  const { data: sessionRows } = await supabase
    .from("sessions")
    .select("id,start_date,start_time,city,state,country,price_cents,deposit_cents,course_id,courses(title,slug)")
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(5);

  const heroSlides =
    (heroRows ?? [])
      .filter((row: any) => row?.is_active ?? true)
      .map((row: any) => ({
        src: toUrl(row?.image_url ?? null) ?? "",
        title: row?.title ?? undefined,
        subtitle: row?.subtitle ?? undefined,
      }))
      .filter((s: any) => s.src) ?? [];

  const fallbackSlides = [
    {
      src: "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/12fd07d0-64ea-40d8-8ef7-a7961b9512fa.webp",
      title: "Lerne von den Besten.",
      subtitle: "Music Mission Institute – Kurse in Musikproduktion, Tontechnik & DJing.",
    },
    {
      src: "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/dc09c738-147b-44ad-8f10-0a7b19c2cc8a.webp",
      title: "Praxis direkt im Studio.",
      subtitle: "Extrem- und Intensivkurse in Österreich & Deutschland.",
    },
  ];

  const slides = heroSlides.length ? heroSlides : fallbackSlides;
  const partners = partnerRows ?? [];
  const faqList: HomeFaq[] =
    (faqRows ?? []).map((f: any) => ({
      q: f.question,
      a: typeof f.answer === "string" ? f.answer : "",
    })) || [];
  const upcomingSessions: HomeSession[] = (sessionRows ?? []).map((s: any) => ({
    id: s.id,
    start_date: s.start_date,
    start_time: s.start_time,
    city: s.city || s.courses?.city || null,
    state: s.state || null,
    country: s.country || null,
    price_cents: s.price_cents,
    deposit_cents: s.deposit_cents,
    courses: s.courses ?? null,
  }));

  const fmtDate = (d?: string | null) =>
    d ? new Date(d + "T00:00:00").toLocaleDateString("de-AT", { weekday: "short", day: "2-digit", month: "short" }) : "Datum folgt";
  const fmtTime = (t?: string | null) => (t ? String(t).slice(0, 5) + " Uhr" : "");

  // stabile Kursliste (nach Titel), keine Zufälligkeit -> keine Hydration-Mismatches
  const coursesMixed: HomeCourse[] = ((courseRows ?? []) as any[])
    .map((c) => ({
      id: c.id as string,
      title: c.title as string,
      slug: c.slug as string | null,
      hero: toUrl(c.hero_image_url ?? null),
      type: c.type_id?.toString().endsWith("102")
        ? ("Intensiv" as const)
        : c.type_id?.toString().endsWith("103")
        ? ("Extrem" as const)
        : ("Kurs" as const),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "de"));

  // JSON-LD: FAQ + Kurs-ItemList für bessere Keyword-Abdeckung ohne optische Änderungen
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at";
  const faqLd =
    faqList.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqList.slice(0, 8).map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: Array.isArray(faq.a) ? faq.a.join(" ") : faq.a,
            },
          })),
        }
      : null;

  const courseItemList =
    coursesMixed.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: coursesMixed
            .filter((c) => c.slug)
            .slice(0, 5)
            .map((course, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              url: `${baseUrl}/kurs/${course.slug}`,
              name: course.title,
            })),
        }
      : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
    ],
  };

  const courseOfferLd =
    upcomingSessions.length > 0
      ? upcomingSessions
          .filter((s) => s.courses?.slug)
          .slice(0, 5)
          .map((s) => {
            const price = s.price_cents ?? s.deposit_cents ?? null;
            const startDate = s.start_date
              ? `${s.start_date}${s.start_time ? `T${s.start_time}` : "T00:00:00"}`
              : undefined;
            const locationParts = [s.city, s.state, s.country].filter(Boolean).join(", ");
            return {
              "@context": "https://schema.org",
              "@type": "Course",
              name: s.courses?.title || "Kurs",
              url: `${baseUrl}/kurs/${s.courses?.slug}`,
              offers: {
                "@type": "Offer",
                priceCurrency: "EUR",
                price: price ? (price / 100).toFixed(2) : undefined,
                availability: "https://schema.org/InStock",
                validFrom: startDate,
              },
              provider: {
                "@type": "Organization",
                name: "Music Mission Institute",
              },
              startDate,
              location: locationParts || undefined,
            };
          })
          .filter((c) => c.offers.price)
      : null;

  const trustpilotRating = parseFloat(process.env.NEXT_PUBLIC_TRUSTPILOT_RATING || "");
  const trustpilotCount = parseInt(process.env.NEXT_PUBLIC_TRUSTPILOT_COUNT || "", 10);
  const trustpilotLd =
    trustpilotRating > 0 && trustpilotCount > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Music Mission Institute",
          url: baseUrl,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: trustpilotRating.toFixed(1),
            reviewCount: trustpilotCount,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : null;

  return (
    <div className="min-h-screen text-foreground bg-white">
      <SiteHeader />
      <h1 className="px-6 pt-[6.5rem] text-center font-anton text-[clamp(32px,5vw,54px)] leading-tight text-slate-900">
        {seo.h1}
      </h1>
      <main className="relative">
        {faqLd ? (
          <Script
            id="home-faq-ld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(faqLd),
            }}
          />
        ) : null}
        {courseItemList ? (
          <Script
            id="home-course-list-ld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(courseItemList),
            }}
          />
        ) : null}
        <Script
          id="home-breadcrumb-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbLd),
          }}
        />
        {courseOfferLd && courseOfferLd.length > 0 ? (
          <Script
            id="home-course-offers-ld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(courseOfferLd),
            }}
          />
        ) : null}
        {trustpilotLd ? (
          <Script
            id="home-trustpilot-ld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(trustpilotLd),
            }}
          />
        ) : null}
        <section className="relative min-h-screen -mt-[5.5rem] sm:-mt-[5.5rem]">
          <div className="flex h-full flex-col">
            <div className="h-[80vh] overflow-visible bg-black relative">
              <HeroSlider slides={heroSlides} />
              <div className="absolute inset-0 pointer-events-none">
                <span className="hero-watermark block text-center font-anton text-[200px] sm:text-[280px] lg:text-[420px] xl:text-[520px] leading-none text-white/30 select-none whitespace-nowrap">
                  MMI
                </span>
              </div>
              {/* Lauftext */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-[0.2vh] pointer-events-none px-4">
                <div className="w-full overflow-hidden">
                  <div className="marquee-track animate-marquee text-white font-bold uppercase tracking-[0.18em] text-[clamp(48px,6vw,96px)] whitespace-nowrap font-montserrat-custom">
                    Kurse für Musikproduktion, Tontechnik, Live-Tontechnik und DJing &nbsp; Kurse für Musikproduktion, Tontechnik, Live-Tontechnik und DJing
                  </div>
                </div>
                <div className="w-full overflow-hidden">
                  <div className="marquee-track animate-marquee-reverse text-[#ff1f8f] font-bold uppercase tracking-[0.18em] text-[clamp(48px,6vw,96px)] whitespace-nowrap font-montserrat-custom">
                    Workshops &amp; Ausbildungen in Österreich und Deutschland &nbsp; Workshops &amp; Ausbildungen in Österreich und Deutschland
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white px-6 py-6 sm:px-12 sm:py-8 md:py-9 text-center flex flex-col items-center gap-4">
              <p className="flex items-center gap-2 sm:gap-3 lg:gap-4 whitespace-nowrap font-semibold text-[#ff1f8f] font-anton leading-[1.05]">
                <span className="text-[clamp(20px,4vw,40px)]">Top-bewertet auf</span>
                <span className="animate-pulse-slow text-[clamp(28px,6vw,64px)] leading-none">★</span>
                <span className="text-[clamp(22px,4.5vw,44px)]">Trustpilot</span>
              </p>
              <a
                className="btn-primary text-sm sm:text-base whitespace-nowrap !text-white inline-flex items-center gap-2"
                href="https://at.trustpilot.com/review/musicmission.at"
                target="_blank"
                rel="noreferrer"
              >
                Bewertungen ansehen
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        <section className="relative bg-white min-h-screen px-6 sm:px-10 lg:px-16 pt-12 pb-6">
          <div className="mx-auto max-w-6xl text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Unsere Kursformate</p>
            <h2 className="font-anton text-3xl sm:text-4xl lg:text-5xl text-slate-900 leading-tight">
              Musikproduktion, Tontechnik, DJing und Vocalcoaching – kurz, knackig oder intensiv
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto">
              Von kompakten Kurzformaten wie unseren Extremkursen bis zu intensiven Ausbildungen.
            </p>
          </div>
          <FlyInCards />
        </section>

        {region === "AT" && (
        <section className="px-6 py-14 sm:px-10 lg:px-16 bg-white">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[40px] border border-slate-200/80 bg-gradient-to-b from-white via-white to-[#f0f1f5] p-[1px] shadow-[0_40px_90px_-70px_rgba(15,23,42,0.8)] isolate">
              <div className="absolute inset-0 pointer-events-none">
                <div className="glass-panel absolute inset-0 -z-10" />
                <div className="glass-sheen absolute inset-0 -z-5" />
              </div>
              <div className="grid gap-8 rounded-[39px] bg-white p-8 lg:grid-cols-[1.1fr_0.9fr] xl:p-10 relative z-10">
                <div className="space-y-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tag der offenen Tür</p>
                  <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">Im GOSH! Studio Wien</h2>
                  <p className="text-base text-slate-600">
                    Hol dir einen klaren Eindruck von unseren Intensivausbildungen und Extremkursen: Studio-Rundgang,
                    Meet-the-Coaches und Live-Praxis-Setup. Freitag, 10. April 2026, 15:00–17:00 Uhr. Teilnahme nur mit
                    Anmeldung – die Plätze sind limitiert.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/tag-der-offenen-tuer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#ff1f8f] px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-[#ff1f8f]/40 transition hover:bg-[#e0007a]"
                    >
                      Jetzt Platz sichern
                      <span aria-hidden="true">→</span>
                    </Link>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=gosh+studio+wien"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-500"
                    >
                      Adresse zeigen
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-slate-900 text-white">
                  <Image
                    src="https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/0f9b4fc0-f88a-454a-a260-503455c41e7c.webp"
                    alt="GOSH! Studio Wien"
                    fill
                    className="h-full w-full object-cover"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/80" />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="shine-sweep absolute left-[-80%] top-0 h-full w-[70%] rounded-full bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-50" />
                    </div>
                    <div className="absolute -left-12 top-4 h-32 w-32 rounded-full bg-pink-500/40 blur-3xl" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="relative h-12 w-12 overflow-hidden rounded-[18px] border border-white/50 bg-white/10">
                      <Image
                        src="https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/9274b0b6-6c3b-40c0-91d5-e529523f9734.webp"
                        alt="GOSH! Logo"
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-6 space-y-1">
                    <p className="text-sm uppercase tracking-[0.3em] text-white/70">Live vor Ort</p>
                    <p className="text-2xl font-semibold text-white">10. April · 15–17 Uhr</p>
                    <p className="text-sm text-white/70">Lerne uns kennen</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Kurs-Marquee */}
        <section className="bg-[#f7f8fb] px-6 py-14 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-6xl space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
                <div className="flex-1 text-center lg:text-center space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Unser Kursangebot</p>
                  <h2 className="font-anton text-3xl sm:text-4xl lg:text-5xl text-slate-900 leading-tight">
                  Aktuelle Kurse für Musikproduktion, Tontechnik &amp; DJing
                  </h2>
                </div>
              <div className="mt-2 lg:mt-0 flex justify-center lg:justify-end">
                <Link
                  href="/entdecken"
                  className="inline-flex items-center gap-2 rounded-full border border-pink-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-pink-50 hover:text-slate-900 whitespace-nowrap !text-slate-900"
                >
                  <span className="text-slate-900 !text-slate-900">Alle Kurse</span>
                  <span aria-hidden className="text-slate-900 !text-slate-900">→</span>
                </Link>
              </div>
            </div>

            {coursesMixed.length === 0 ? (
              <p className="text-sm text-slate-600">Aktuell keine Kurse geladen.</p>
            ) : (
              <CourseRail courses={coursesMixed} />
            )}
          </div>
        </section>

        {/* Video Abschnitt (lazy) */}
        <section className="relative h-[70vh] w-full overflow-hidden bg-black">
          <iframe
            title="MMI Video"
            src="https://player.vimeo.com/video/1169223499?background=1&autoplay=1&loop=1&muted=1&controls=0"
            loading="lazy"
            className="absolute left-1/2 top-1/2 min-w-[140%] min-h-[140%] -translate-x-1/2 -translate-y-1/2"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-black/70 pointer-events-none" />
          <div className="relative h-full flex items-center justify-center px-4">
            <div className="text-center leading-[1.05] space-y-3 max-w-[80%] mx-auto">
              {[
                { text: "Unsere Kurse bringen dir", size: "clamp(48px,8vw,90px)" },
                { text: "Wissen und Praxis.", size: "clamp(48px,8vw,90px)" },
                { text: "Direkt im Studio.", size: "clamp(36px,6vw,70px)" },
                { text: "Direkt von Profis.", size: "clamp(28px,5vw,60px)" },
              ].map((line) => (
                <p
                  key={line.text}
                  className="font-anton font-bold drop-shadow-[0_10px_32px_rgba(0,0,0,0.55)] whitespace-pre-line"
                  style={{
                    fontSize: line.size,
                    backgroundImage: "linear-gradient(90deg,#ff1f8f 0%, #ff70c5 40%, #ffffff 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {line.text}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Partner Abschnitt – Logo Marquee (Client) */}
        <section className="relative z-30 bg-white text-slate-900 overflow-hidden py-14 sm:py-16">
          <div className="relative mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 space-y-6">
            <PartnerMarqueeClient partners={partners} fallbackLogos={partnerLogos} />
          </div>
        </section>



        {faqList.length > 0 && (
          <section id="faq" className="relative z-30 bg-[#f3f4f6] px-6 py-20 sm:px-10 lg:px-20 min-h-[70vh]">
            <div className="mx-auto max-w-6xl space-y-10">
              <div className="text-center space-y-4">
                <h2 className="font-anton text-[clamp(72px,9vw,90px)] leading-[0.9] text-slate-900">
                  Fragen zu Musikproduktion &amp; Tontechnik Kursen? Wir haben die Antworten.
                </h2>
                <p className="text-base sm:text-lg text-slate-700 max-w-3xl mx-auto">
                  Die wichtigsten Fragen unserer Teilnehmer – kompakt beantwortet. Ablauf, Zertifikat, Online-Zugang, Zahlung und mehr.
                </p>
              </div>
              <FAQAccordion items={faqList} initiallyOpen={0} />
            </div>
          </section>
        )}

        {/* Consult CTA */}
        <section className="relative bg-white">
          <ConsultBanner height="80vh" overlapOffset="0" zIndex="z-40" />
        </section>
      </main>
    </div>
  );
}
