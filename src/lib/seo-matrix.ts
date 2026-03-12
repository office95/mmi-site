import type { Metadata } from "next";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getRegion } from "@/lib/region";

export type DomainVariant = "at" | "de";

export type SeoMatrixEntry = {
  id: string;
  page_key: string;
  slug: string;
  domain_variant: DomainVariant;
  locale: "de-AT" | "de-DE";
  title_tag: string;
  meta_description: string | null;
  h1: string;
  hero_subline: string | null;
  canonical_url: string | null;
  hreflang_target_url: string | null;
  robots_index: boolean | null;
  robots_follow: boolean | null;
  country_label: string | null;
};

export type ResolvedSeo = {
  title: string;
  description: string;
  canonical: string;
  languages: Record<string, string>;
  robots: { index: boolean; follow: boolean };
  h1: string;
  heroSubline?: string;
  locale: string;
  domainVariant: DomainVariant;
  counterpartVariant: DomainVariant;
  entry: SeoMatrixEntry | null;
  counterpart: SeoMatrixEntry | null;
  source: "matrix" | "fallback";
  warnings: string[];
};

export type SeoDefaults = {
  pageKey: string;
  defaultSlug: string;
  defaultTitle: string;
  defaultDescription?: string;
  defaultH1?: string;
  defaultHeroSubline?: string;
};

export type SeoOverride = {
  slug?: string;
  title?: string;
  description?: string;
  h1?: string;
  heroSubline?: string;
  location?: string;
};

const normalizeSlug = (raw: string | null | undefined) => {
  if (!raw) return "/";
  let s = raw.trim();
  if (!s) return "/";
  try {
    const asUrl = new URL(s.startsWith("http") ? s : `https://placeholder${s.startsWith("/") ? "" : "/"}${s}`);
    s = asUrl.pathname || "/";
  } catch {
    /* ignore */
  }
  if (!s.startsWith("/")) s = `/${s}`;
  s = s.replace(/\s+/g, "").replace(/\/+$/, "");
  return s || "/";
};

const originForVariant = (variant: DomainVariant) => {
  const env = variant === "de" ? process.env.NEXT_PUBLIC_DOMAIN_DE : process.env.NEXT_PUBLIC_DOMAIN_AT;
  const fallback = process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at";
  if (!env) return fallback;
  if (env.startsWith("http")) return env;
  return `https://${env}`;
};

const applyPlaceholders = (template: string | null | undefined, replacements: Record<string, string>, fallback: string): string => {
  if (!template) return fallback;
  let out = template;
  for (const [key, value] of Object.entries(replacements)) {
    const safe = value && value.trim().length ? value.trim() : fallback;
    out = out.split(`{{${key}}}`).join(safe);
  }
  // Entferne verbleibende Platzhalter, falls nicht befüllt, durch Fallback
  if (out.includes("{{")) return fallback;
  return out.replace(/\s+/g, " ").trim();
};

export async function fetchSeoForPage(defaults: SeoDefaults, override?: SeoOverride): Promise<ResolvedSeo> {
  const region = await getRegion();
  const domainVariant: DomainVariant = region === "DE" ? "de" : "at";
  const otherVariant: DomainVariant = domainVariant === "de" ? "at" : "de";
  const supabase = getSupabaseServiceClient();

  const { data } = await supabase.from("seo_matrix").select("*").eq("page_key", defaults.pageKey);
  const entry = (data || []).find((r) => r.domain_variant === domainVariant) as SeoMatrixEntry | undefined | null;
  const counterpart = (data || []).find((r) => r.domain_variant === otherVariant) as SeoMatrixEntry | undefined | null;

  const slug = normalizeSlug(override?.slug ?? entry?.slug ?? defaults.defaultSlug ?? "/");
  const counterpartSlug = normalizeSlug(counterpart?.slug ?? override?.slug ?? defaults.defaultSlug ?? "/");

  const replacements: Record<string, string> = {
    title: override?.title || defaults.defaultTitle,
    location: override?.location || "",
  };

  const rawTitle = entry?.title_tag || override?.title || defaults.defaultTitle;
  const rawDescription = entry?.meta_description || override?.description || defaults.defaultDescription || "";
  const rawH1 = entry?.h1 || override?.h1 || defaults.defaultH1 || rawTitle;
  const rawHeroSubline = entry?.hero_subline || override?.heroSubline || defaults.defaultHeroSubline || undefined;

  const entryTitle = applyPlaceholders(rawTitle, replacements, defaults.defaultTitle);
  const entryDescription = applyPlaceholders(rawDescription, replacements, defaults.defaultDescription || "");
  const h1 = applyPlaceholders(rawH1, replacements, defaults.defaultH1 || entryTitle);
  const heroSubline = rawHeroSubline ? applyPlaceholders(rawHeroSubline, replacements, rawHeroSubline) : undefined;

  const selfOrigin = originForVariant(domainVariant).replace(/\/$/, "");
  const otherOrigin = originForVariant(otherVariant).replace(/\/$/, "");

  const canonical = entry?.canonical_url?.trim() || `${selfOrigin}${slug}`;
  const altUrl = entry?.hreflang_target_url?.trim() || counterpart?.canonical_url?.trim() || `${otherOrigin}${counterpartSlug}`;

  const localeSelf = entry?.locale || (domainVariant === "de" ? "de-DE" : "de-AT");
  const localeOther = counterpart?.locale || (otherVariant === "de" ? "de-DE" : "de-AT");

  const warnings: string[] = [];
  if (!entry) warnings.push("missing_entry");
  if (!counterpart) warnings.push("missing_counterpart");
  if (!entry?.canonical_url) warnings.push("missing_canonical");
  if (!entry?.hreflang_target_url && !counterpart?.canonical_url) warnings.push("missing_hreflang");

  if (!entry) {
    console.warn(`[seo-matrix] Fallback genutzt für ${defaults.pageKey} (${domainVariant})`);
  }

  const robots = {
    index: entry?.robots_index !== false,
    follow: entry?.robots_follow !== false,
  };

  const languages: Record<string, string> = {
    [localeSelf]: canonical,
    [localeOther]: altUrl,
    "x-default": canonical,
  };

  return {
    title: entryTitle,
    description: entryDescription,
    canonical,
    languages,
    robots,
    h1,
    heroSubline,
    locale: localeSelf,
    domainVariant,
    counterpartVariant: otherVariant,
    entry: entry || null,
    counterpart: counterpart || null,
    source: entry ? "matrix" : "fallback",
    warnings,
  };
}

export const resolvedSeoToMetadata = (seo: ResolvedSeo): Metadata => {
  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: seo.canonical,
      languages: seo.languages,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
      locale: seo.locale.replace("-", "_"),
      siteName: "Music Mission Institute",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
    robots: {
      index: seo.robots.index,
      follow: seo.robots.follow,
    },
  };
};
