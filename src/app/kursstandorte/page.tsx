import type { Metadata } from "next";
import KursstandorteClient from "./KursstandorteClient";

const SITE_AT = process.env.NEXT_PUBLIC_DOMAIN_AT || process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at";
const SITE_DE = process.env.NEXT_PUBLIC_DOMAIN_DE || "https://musicmission.de";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kursstandorte | Music Mission Institute",
  description: "Alle Partner-Standorte für Kurse in Musikproduktion, Tontechnik, Live-Sound, DJing und Vocalcoaching in AT & DE.",
  alternates: {
    canonical: "/kursstandorte",
    languages: {
      "de-AT": `${SITE_AT}/kursstandorte`,
      "de-DE": `${SITE_DE}/kursstandorte`,
      "x-default": `${SITE_AT}/kursstandorte`,
    },
  },
  openGraph: {
    title: "Kursstandorte | Music Mission Institute",
    description: "Finde Studios und Partner-Locations für Music Mission Kurse in Österreich und Deutschland.",
    url: "/kursstandorte",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kursstandorte | Music Mission Institute",
    description: "Alle Partner-Standorte für Musikproduktion, Tontechnik, DJing & Vocalcoaching in DACH.",
  },
};

export default function KursstandortePage() {
  return <KursstandorteClient />;
}
