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

export const revalidate = 0;

export default async function Home() {
  const hdr = headers();
  const get = (key: string) => (typeof (hdr as any).get === "function" ? ((hdr as any).get(key) as string | null) : null);
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
      : getRegion());
  const supabase = getSupabaseServiceClient();
  const { data: heroRows } = await supabase.from("hero_slides").select("image_url,title,subtitle").order("created_at", { ascending: true });
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
  const today = new Date().toISOString().slice(0, 10);
  const { data: sessionRows } = await supabase
    .from("sessions")
    .select("id,start_date,start_time,city,state,country,price_cents,deposit_cents,course_id,courses(title,slug)")
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(5);

  const heroSlides =
    (heroRows ?? [])
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

  return (
    <div className="min-h-screen text-foreground bg-white">
      <SiteHeader />
      <main className="relative">
        <section className="relative min-h-screen">
          <div className="flex h-full flex-col">
            <div className="h-[80vh] overflow-visible bg-black relative">
              <HeroSlider slides={heroSlides} />
              <div className="absolute inset-0 pointer-events-none">
                <span
                  className="block text-center font-anton text-[200px] sm:text-[280px] lg:text-[420px] xl:text-[520px] leading-none text-white/30 select-none whitespace-nowrap"
                  style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%" }}
                >
                  MMI
                </span>
              </div>
              {/* Lauftext */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-[0.2vh] pointer-events-none px-4">
                <div className="w-full overflow-hidden">
                  <div className="marquee-track animate-marquee text-white font-bold uppercase tracking-[0.18em] text-[clamp(48px,6vw,96px)] whitespace-nowrap" style={{ fontFamily: "\"Montserrat\", sans-serif" }}>
                    {Array(8)
                      .fill("Kurse für Musikproduktion, Tontechnik, Live-Tontechnik und DJing   ")
                      .join("")}
                  </div>
                </div>
                <div className="w-full overflow-hidden">
                  <div className="marquee-track animate-marquee-reverse text-[#ff1f8f] font-bold uppercase tracking-[0.18em] text-[clamp(48px,6vw,96px)] whitespace-nowrap" style={{ fontFamily: "\"Montserrat\", sans-serif" }}>
                    {Array(8)
                      .fill("Kurse für Musikproduktion, Tontechnik, Live-Tontechnik und DJing   ")
                      .join("")}
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-[5%] z-30 px-6 sm:px-10 lg:px-20">
                <div className="mx-auto w-full max-w-[620px]">
                  <p className="text-center text-white text-sm sm:text-base font-semibold tracking-[0.08em] uppercase mb-3">
                    Kurse in Musikproduktion · Tontechnik · DJ · Vocalcoaching
                  </p>
                  <CourseSearch />
                </div>
              </div>
            </div>
            <div className="bg-white px-6 py-8 sm:px-12 sm:py-10 md:py-12 flex items-center justify-center">
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 whitespace-nowrap font-semibold text-[#ff1f8f] font-anton leading-[1.05] pb-2 sm:pb-0">
                  <span className="text-[clamp(20px,4vw,40px)]">Top-bewertet auf</span>
                  <span className="animate-pulse-slow text-[clamp(28px,6vw,64px)] leading-none">★</span>
                  <span className="text-[clamp(22px,4.5vw,44px)]">Trustpilot</span>
                </div>
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
          </div>
        </section>

        <section className="relative bg-white min-h-screen">
          <FlyInCards />
        </section>

        {/* Partner Abschnitt – Logo Marquee (Client) */}
        <section className="relative z-30 bg-white text-slate-900 overflow-hidden py-14 sm:py-16">
          <div className="relative mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 space-y-6">
            <PartnerMarqueeClient partners={partners} fallbackLogos={partnerLogos} />
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



        {faqList.length > 0 && (
          <section id="faq" className="relative z-30 bg-[#f3f4f6] px-6 py-20 sm:px-10 lg:px-20 min-h-[70vh]">
            <div className="mx-auto max-w-6xl space-y-10">
              <div className="text-center space-y-4">
                <h2 className="font-anton text-[clamp(72px,9vw,90px)] leading-[0.9] text-slate-900">Fragen? Wir haben die Antworten.</h2>
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
