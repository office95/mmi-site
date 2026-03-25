import EntdeckenClient from "../EntdeckenClient";
import { fetchSeoForPage, resolvedSeoToMetadata } from "@/lib/seo-matrix";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const defaults = {
  pageKey: "entdecken",
  defaultSlug: "/entdecken/favoriten",
  defaultTitle: "Kurstermine Favoriten | Music Mission Institute",
  defaultDescription: "Deine gemerkten Kurstermine in Musikproduktion, Tontechnik, DJing und Vocalcoaching.",
  defaultH1: "Deine gemerkten Kurstermine",
  defaultHeroSubline: "Schnell zu deinen Favoriten.",
};

export async function generateMetadata() {
  const seo = await fetchSeoForPage(defaults);
  return resolvedSeoToMetadata(seo);
}

export default async function EntdeckenFavoritenPage() {
  const seo = await fetchSeoForPage(defaults);
  return <EntdeckenClient h1={seo.h1} heroSubline={seo.heroSubline} defaultOnlyFavs />;
}
