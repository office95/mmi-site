import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";
import { getRegion } from "@/lib/region";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { Analytics } from "@vercel/analytics/next";
import { Anton, Space_Grotesk, Lato, Archivo_Black } from "next/font/google";

const fontSpace = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const fontLato = Lato({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });
const fontAnton = Anton({ subsets: ["latin"], weight: "400", display: "swap" });
const fontArchivo = Archivo_Black({ subsets: ["latin"], weight: "400", display: "swap" });

const siteUrlEnv = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005";
const domainAT = process.env.NEXT_PUBLIC_DOMAIN_AT;
const domainDE = process.env.NEXT_PUBLIC_DOMAIN_DE;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = siteUrlEnv;
  const languageAlternates: Record<string, string> = {
    "x-default": siteUrl,
    de: "/",
    "de-AT": domainAT ? `https://${domainAT}` : siteUrl,
    "de-DE": domainDE ? `https://${domainDE}` : siteUrl.replace("musicmission.at", "musicmission.de"),
  };

  let faviconUrl: string | undefined;
  try {
    const supabase = getSupabaseServiceClient();
    const { data } = await supabase.from("settings").select("value").eq("key", "site_favicon_url").maybeSingle();
    faviconUrl = (data?.value as string | null) || undefined;
  } catch {
    faviconUrl = undefined;
  }

  const defaultImage = "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/db3152ef-7e1f-4a78-bb88-7528a892fdc4.webp";

  return {
    title: "Musikproduktion, DJ & Vocal Kurse | Music Mission Institute",
    description:
      "Music Mission Institute ist Anbieter für Kurse in Musikproduktion, Tontechnik, Livetontechnik, DJing und Vocalcoaching. Praxisnahe Kurse mit Profis aus der Musikbranche.",
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: "/",
      languages: languageAlternates,
    },
    icons: faviconUrl
      ? [
          { rel: "icon", url: faviconUrl },
          { rel: "shortcut icon", url: faviconUrl },
        ]
      : [
          { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
          { rel: "shortcut icon", url: "/favicon.svg", type: "image/svg+xml" },
        ],
    keywords: ["Musikproduktion", "Tontechnik", "Live-Sound", "DJing", "Kurse", "Workshops", "Music Mission Institute"],
    openGraph: {
      type: "website",
      url: siteUrl,
      siteName: "Music Mission Institute",
      title: "Musikproduktion, DJ & Vocal Kurse | Music Mission Institute",
      description:
        "Anbieter für Musikproduktion, Tontechnik, Livetontechnik, DJing und Vocalcoaching – praxisnah mit Profis aus der Musikbranche.",
      locale: "de_AT",
      images: [defaultImage],
    },
    twitter: {
      card: "summary_large_image",
      title: "Musikproduktion, DJ & Vocal Kurse | Music Mission Institute",
      description: "Kurse in Musikproduktion, Tontechnik, Livetontechnik, DJing und Vocalcoaching in DACH.",
      images: [defaultImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const region = await getRegion();
  const siteUrl = siteUrlEnv;
  const altLinks = [
    { hreflang: "x-default", href: siteUrl },
    { hreflang: "de-AT", href: domainAT ? `https://${domainAT}` : siteUrl },
    { hreflang: "de-DE", href: domainDE ? `https://${domainDE}` : siteUrl.replace("musicmission.at", "musicmission.de") },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Music Mission Institute",
    url: siteUrl,
    logo: "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/db3152ef-7e1f-4a78-bb88-7528a892fdc4.webp",
    sameAs: ["https://musicmission.at", "https://at.trustpilot.com/review/musicmission.at"],
  };

  return (
    <html lang="de" data-region={region}>
      <head>
        {altLinks.map((l) => (
          <link key={l.hreflang} rel="alternate" hrefLang={l.hreflang} href={l.href} />
        ))}
      </head>
      <body
        className={`${fontSpace.className} antialiased pt-14 sm:pt-16`}
        style={
          {
            "--font-sans": fontLato.style.fontFamily,
            "--font-display": fontSpace.style.fontFamily,
            "--font-archivo": fontArchivo.style.fontFamily,
            "--font-anton": fontAnton.style.fontFamily,
          } as React.CSSProperties
        }
      >
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
        <Analytics />
        <SiteFooter />
      </body>
    </html>
  );
}
