import type { Metadata } from "next";
import ProfessionalAudioDiplomaClient from "./ProfessionalAudioDiplomaClient";

const SITE_AT = process.env.NEXT_PUBLIC_DOMAIN_AT || process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at";
const SITE_DE = process.env.NEXT_PUBLIC_DOMAIN_DE || "https://musicmission.de";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Professional Audio Diploma – Tontechnik | Music Mission Institute",
  description:
    "Berufsbegleitender Studiengang für Tontechnik, Musikproduktion, Live-Sound, DJing und Mastering – mit 180 ECTS und Branchen-Profis.",
  alternates: {
    canonical: "/professional-audio-diploma",
    languages: {
      "de-AT": `${SITE_AT}/professional-audio-diploma`,
      "de-DE": `${SITE_DE}/professional-audio-diploma`,
      "x-default": `${SITE_AT}/professional-audio-diploma`,
    },
  },
  openGraph: {
    title: "Professional Audio Diploma – Tontechnik | Music Mission Institute",
    description:
      "6 Semester berufsbegleitend: Recording, Mixing, Mastering, Live-Tontechnik, DJing, Business – mit 180 ECTS.",
    url: "/professional-audio-diploma",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Professional Audio Diploma – Tontechnik | Music Mission Institute",
    description: "Berufsbegleitender Studiengang für Tontechnik, Musikproduktion, Live-Sound, DJing und Mastering.",
  },
};

export default function ProfessionalAudioDiplomaPage() {
  return <ProfessionalAudioDiplomaClient />;
}
