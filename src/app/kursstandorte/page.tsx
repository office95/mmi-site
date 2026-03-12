import KursstandorteClient from "./KursstandorteClient";
import { fetchSeoForPage, resolvedSeoToMetadata } from "@/lib/seo-matrix";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const defaults = {
  pageKey: "kursstandorte",
  defaultSlug: "/kursstandorte",
  defaultTitle: "Kursstandorte | Music Mission Institute",
  defaultDescription: "Alle Partner-Standorte für Kurse in Musikproduktion, Tontechnik, Live-Sound, DJing und Vocalcoaching in AT & DE.",
  defaultH1: "Kursstandorte",
};

export async function generateMetadata() {
  const seo = await fetchSeoForPage(defaults);
  return resolvedSeoToMetadata(seo);
}

export default async function KursstandortePage() {
  const seo = await fetchSeoForPage(defaults);
  return (
    <>
      <h1 className="sr-only">{seo.h1}</h1>
      <KursstandorteClient title={seo.h1} subtitle={seo.heroSubline} />
    </>
  );
}
