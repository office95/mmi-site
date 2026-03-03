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
import dynamic from "next/dynamic";

const PartnerMarqueeClient = dynamic(() => import("@/components/PartnerMarqueeClient").then((m) => m.PartnerMarqueeClient), {
  ssr: false,
});
import { URL } from "node:url";

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

const faqList = [
  {
    q: "Welche Formate bietet ihr an?",
    a: [
      "Extremkurse (kompakt, maximale Praxis in kurzer Zeit) und Intensiv-Ausbildungen (berufsbegleitend).",
      "Professional Audio Diploma (Tontechnik) und Vorbereitung auf den Bachelor of Science sind möglich.",
    ],
  },
  {
    q: "Wie buche ich einen Kurs?",
    a: [
      "Online über Stripe Checkout. Du siehst Preis, Steuer, optionalen Rabattcode und wählst Termin & Kurs.",
      "Nach erfolgreicher Zahlung bekommst du sofort die Bestätigung per E-Mail.",
    ],
  },
  {
    q: "Kann ich nur eine Anzahlung leisten?",
    a: [
      "Ja. Viele Termine bieten eine Anzahlung (Deposit) an. Der Restbetrag wird später fällig; Reminder folgt.",
      "Die Sitzplatz-Reservierung erfolgt erst nach erfolgreicher Zahlung (Webhook-Update).",
    ],
  },
  {
    q: "Wie funktionieren Gutscheine/Promotion Codes?",
    a: [
      "Gutscheine werden direkt im Stripe Checkout Feld „Promotion Code“ eingegeben.",
      "Rabatte, Coupon-Code und Discount-Betrag werden in deiner Bestellung gespeichert.",
    ],
  },
  {
    q: "Wo finden die Kurse statt?",
    a: [
      "An Partnerstandorten in Österreich & Deutschland, meist in professionellen Studios.",
      "Die genaue Adresse steht beim gewählten Termin (Standort/Partner-Seite).",
    ],
  },
  {
    q: "Wie viele Teilnehmerplätze gibt es?",
    a: [
      "Limitierte Plätze pro Termin; die Plätze werden erst nach Zahlung im System geblockt.",
      "Sobald die maximale Teilnehmerzahl erreicht ist, wird der Termin als ausgebucht markiert.",
    ],
  },
  {
    q: "Welche Zahlungsarten bietet ihr an?",
    a: ["Stripe Checkout: Kredit-/Debitkarte, Apple Pay, Google Pay (abhängig vom Gerät)."],
  },
  {
    q: "Kann ich stornieren?",
    a: [
      "Storno-Regeln variieren je nach Kurs/Termin. Bitte melde dich zeitnah, damit wir deinen Platz freigeben können.",
    ],
  },
];

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
    .select("name,slug,state,city,logo_path,country")
    .order("name", { ascending: true });

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

  return (
    <div className="min-h-screen text-foreground bg-white">
      <SiteHeader />
      <main className="relative">
        <section className="relative min-h-screen">
          <div className="flex h-full flex-col">
            <div className="h-[80vh] overflow-visible bg-black relative">
              <HeroSlider slides={heroSlides} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="font-anton text-[240px] sm:text-[320px] lg:text-[440px] xl:text-[520px] leading-none text-white/5 select-none">
                  MMI
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-[5%] z-30 px-6 sm:px-10 lg:px-20">
                <div className="mx-auto w-full max-w-[540px]">
                  <p className="text-center text-white font-anton text-xl sm:text-2xl mb-2 leading-tight">
                    Finde jetzt deinen passenden Kurs
                  </p>
                  <CourseSearch />
                </div>
              </div>
            </div>
            <div className="h-[16vh] sm:h-[20vh] bg-white px-6 py-6 sm:px-12 flex items-center justify-center">
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="flex items-center gap-2 sm:gap-3 text-[28px] sm:text-[36px] lg:text-[46px] font-semibold text-[#ff1f8f] font-anton leading-[1.05] pb-2 sm:pb-0">
                  <span>Top-bewertet auf</span>
                  <span className="animate-pulse-slow text-[36px] sm:text-[52px] lg:text-[64px] leading-none">★</span>
                  <span>Trustpilot</span>
                </div>
                <a
                  className="text-lg sm:text-xl font-semibold text-[#ff1f8f] underline underline-offset-8 hover:text-[#e40073]"
                  href="https://at.trustpilot.com/review/musicmission.at"
                  target="_blank"
                  rel="noreferrer"
                >
                  Bewertungen ansehen
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="relative bg-white min-h-screen -mt-12 sm:-mt-14">
          <FlyInCards />
        </section>

                {/* Partner Abschnitt – Logo Marquee (Client) */}
        <section className="relative z-30 bg-[#f3f4f6] text-slate-900 overflow-hidden py-14 sm:py-16">
          <div className="relative mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 space-y-6">
            <PartnerMarqueeClient partners={partners} fallbackLogos={partnerLogos} />
          </div>
        </section>



        {/* FAQ Abschnitt */}
        <section id="faq" className="relative z-30 bg-[#f3f4f6] px-6 py-20 sm:px-10 lg:px-20 min-h-[70vh]">
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="text-center space-y-4">
              <h2 className="font-anton text-[64px] sm:text-[80px] lg:text-[100px] leading-[0.9] text-slate-900">Fragen? Wir haben die Antworten.</h2>
            </div>
            <FAQAccordion items={faqList} initiallyOpen={0} />
          </div>
        </section>

        {/* Consult CTA */}
        <section className="relative bg-white">
          <ConsultBanner height="80vh" overlapOffset="0" zIndex="z-40" />
        </section>
      </main>
    </div>
  );
}
