import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";
import { getRegion } from "@/lib/region";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { Analytics } from "@vercel/analytics/next";

const siteUrlEnv = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005";
const domainAT = process.env.NEXT_PUBLIC_DOMAIN_AT;
const domainDE = process.env.NEXT_PUBLIC_DOMAIN_DE;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = siteUrlEnv;
  const languageAlternates: Record<string, string> = { de: "/" };
  if (domainAT) languageAlternates["de-AT"] = `https://${domainAT}`;
  if (domainDE) languageAlternates["de-DE"] = `https://${domainDE}`;

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
    title: "Musikproduktion, Tontechnik, DJ & Vocal Kurse | Music Mission Institute",
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
      title: "Musikproduktion, Tontechnik, DJ & Vocal Kurse | Music Mission Institute",
      description:
        "Anbieter für Musikproduktion, Tontechnik, Livetontechnik, DJing und Vocalcoaching – praxisnah mit Profis aus der Musikbranche.",
      locale: "de_AT",
      images: [defaultImage],
    },
    twitter: {
      card: "summary_large_image",
      title: "Musikproduktion, Tontechnik, DJ & Vocal Kurse | Music Mission Institute",
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
        {/* Web-fonts aus CDN laden, um Offline-Build zu vermeiden */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Lato:wght@400;700&family=Archivo+Black&family=Anton&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased pt-14 sm:pt-16">
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
        <Analytics />
        <SiteFooter />
      </body>
    </html>
  );
}
