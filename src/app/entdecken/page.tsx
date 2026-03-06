import type { Metadata } from "next";
import EntdeckenClient from "./EntdeckenClient";

const SITE_AT = process.env.NEXT_PUBLIC_DOMAIN_AT || process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at";
const SITE_DE = process.env.NEXT_PUBLIC_DOMAIN_DE || "https://musicmission.de";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kurstermine entdecken | Music Mission Institute",
  description: "Alle kommenden Kurstermine in Musikproduktion, Tontechnik, Livetontechnik, DJing und Vocalcoaching in Österreich & Deutschland.",
  alternates: {
    canonical: "/entdecken",
    languages: {
      "de-AT": `${SITE_AT}/entdecken`,
      "de-DE": `${SITE_DE}/entdecken`,
      "x-default": `${SITE_AT}/entdecken`,
    },
  },
  openGraph: {
    title: "Kurstermine entdecken | Music Mission Institute",
    description: "Filtere Kurse nach Ort, Partner und Kategorie – jetzt Termin sichern.",
    url: "/entdecken",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kurstermine entdecken | Music Mission Institute",
    description: "Alle Music Mission Termine für Musikproduktion, Tontechnik, DJing & Vocalcoaching.",
  },
};

export default function EntdeckenPage() {
  return <EntdeckenClient />;
}
