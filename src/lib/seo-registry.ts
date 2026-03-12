export type SeoRegistryEntry = {
  pageKey: string;
  slug: string;
  defaultTitle: string;
  defaultH1: string;
  defaultDescription?: string;
};

/**
 * Zentrale Liste aller logischen Seiten/Template-Schlüssel.
 * Wird genutzt, um fehlende SEO-Matrix-Einträge automatisch zu seeden,
 * damit neue Seiten sofort im Admin erscheinen.
 */
export const SEO_PAGE_REGISTRY: SeoRegistryEntry[] = [
  {
    pageKey: "homepage",
    slug: "/",
    defaultTitle: "Music Mission Institute – Kurse in Musikproduktion & Tontechnik",
    defaultH1: "Music Mission Institute",
    defaultDescription:
      "Musikproduktion, Tontechnik, DJing & Vocalcoaching – praxisnah mit Profis in AT & DE.",
  },
  {
    pageKey: "entdecken",
    slug: "/entdecken",
    defaultTitle: "Kurstermine entdecken | Music Mission Institute",
    defaultH1: "Alle Kurstermine",
  },
  {
    pageKey: "standorte",
    slug: "/standorte",
    defaultTitle: "Standorte | Music Mission Institute",
    defaultH1: "Unsere Partner-Standorte",
  },
  {
    pageKey: "kursstandorte",
    slug: "/kursstandorte",
    defaultTitle: "Kursstandorte | Music Mission Institute",
    defaultH1: "Kursstandorte",
  },
  {
    pageKey: "extremkurs",
    slug: "/extremkurs",
    defaultTitle: "Extremkurse | Music Mission Institute",
    defaultH1: "Extremkurse Musikproduktion & Live-Tontechnik",
  },
  {
    pageKey: "intensiv",
    slug: "/intensiv",
    defaultTitle: "Intensivausbildungen | Music Mission Institute",
    defaultH1: "Intensivausbildungen Musikproduktion & Tontechnik",
  },
  {
    pageKey: "professional-audio-diploma",
    slug: "/professional-audio-diploma",
    defaultTitle: "Professional Audio Diploma | Music Mission Institute",
    defaultH1: "Professional Audio Diploma",
  },
  {
    pageKey: "partner-werden",
    slug: "/partner-werden",
    defaultTitle: "Partner werden | Music Mission Institute",
    defaultH1: "Partner werden",
  },
  {
    pageKey: "ueber-uns",
    slug: "/ueber-uns",
    defaultTitle: "Über uns | Music Mission Institute",
    defaultH1: "Über uns",
  },
  {
    pageKey: "blog",
    slug: "/blog",
    defaultTitle: "Blog | Music Mission Institute",
    defaultH1: "Blog: Musikproduktion, Tontechnik, DJing & Live-Sound",
  },
  // Templates / dynamische Seiten
  {
    pageKey: "kurs-template",
    slug: "/kurs/[slug]",
    defaultTitle: "Kurs | Music Mission Institute",
    defaultH1: "Kurs",
  },
  {
    pageKey: "partner-template",
    slug: "/partner/[slug]",
    defaultTitle: "Partner | Music Mission Institute",
    defaultH1: "Partner",
  },
];
