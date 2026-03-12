import EntdeckenClient from "./EntdeckenClient";
import { fetchSeoForPage, resolvedSeoToMetadata } from "@/lib/seo-matrix";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const defaults = {
  pageKey: "entdecken",
  defaultSlug: "/entdecken",
  defaultTitle: "Kurstermine entdecken | Music Mission Institute",
  defaultDescription: "Alle kommenden Kurstermine in Musikproduktion, Tontechnik, Livetontechnik, DJing und Vocalcoaching in Österreich & Deutschland.",
  defaultH1: "Alle Kurstermine in Österreich",
  defaultHeroSubline: "Entdecke unser Angebot an innovativen Kursen.",
};

export async function generateMetadata() {
  const seo = await fetchSeoForPage(defaults);
  return resolvedSeoToMetadata(seo);
}

export default async function EntdeckenPage() {
  const seo = await fetchSeoForPage(defaults);
  return <EntdeckenClient h1={seo.h1} heroSubline={seo.heroSubline} />;
}
