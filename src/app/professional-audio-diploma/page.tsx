import ProfessionalAudioDiplomaClient from "./ProfessionalAudioDiplomaClient";
import { fetchSeoForPage, resolvedSeoToMetadata } from "@/lib/seo-matrix";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const defaults = {
  pageKey: "professional-audio-diploma",
  defaultSlug: "/professional-audio-diploma",
  defaultTitle: "Professional Audio Diploma – Tontechnik | Music Mission Institute",
  defaultDescription:
    "Berufsbegleitender Studiengang für Tontechnik, Musikproduktion, Live-Sound, DJing und Mastering – mit 180 ECTS und Branchen-Profis.",
  defaultH1: "Professional Audio Diploma",
  defaultHeroSubline: "Berufsbegleitender Studiengang für Tontechnik, Musikproduktion, Live-Sound, DJing und Mastering.",
};

export async function generateMetadata() {
  const seo = await fetchSeoForPage(defaults);
  return resolvedSeoToMetadata(seo);
}

export default async function ProfessionalAudioDiplomaPage() {
  const seo = await fetchSeoForPage(defaults);
  return <ProfessionalAudioDiplomaClient h1={seo.h1} heroSubline={seo.heroSubline} />;
}
