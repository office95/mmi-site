import type { MetadataRoute } from "next";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getSiteUrl } from "@/lib/site-url";

const RETIRED_POST_SLUGS = new Set([
  "willkommen",
  "willkommen-bei-mmi",
  "welcome-mmi",
  "fgdfgfdgdfgfg",
]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseServiceClient();
  const baseUrl = getSiteUrl();

  const urls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/entdecken`, lastModified: new Date() },
    { url: `${baseUrl}/kursstandorte`, lastModified: new Date() },
    { url: `${baseUrl}/standorte`, lastModified: new Date() },
    { url: `${baseUrl}/intensiv`, lastModified: new Date() },
    { url: `${baseUrl}/extremkurs`, lastModified: new Date() },
    { url: `${baseUrl}/blog`, lastModified: new Date() },
    { url: `${baseUrl}/ueber-uns`, lastModified: new Date() },
    { url: `${baseUrl}/professional-audio-diploma`, lastModified: new Date() },
  ];

  try {
    const [{ data: courses }, { data: partners }, { data: posts }] = await Promise.all([
      supabase.from("courses").select("slug, updated_at"),
      supabase.from("partners").select("slug, updated_at"),
      supabase.from("posts").select("slug, published_at, updated_at").eq("status", "published"),
    ]);

    (courses ?? []).forEach((c) => {
      if (!c.slug) return;
      urls.push({
        url: `${baseUrl}/kurs/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
      });
    });

    (partners ?? []).forEach((p) => {
      if (!p.slug) return;
      urls.push({
        url: `${baseUrl}/partner/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      });
    });

    (posts ?? []).forEach((p) => {
      if (!p.slug) return;
      if (RETIRED_POST_SLUGS.has(p.slug)) return; // Alt-URLs aus der Sitemap ausschließen
      urls.push({
        url: `${baseUrl}/blog/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : p.published_at ? new Date(p.published_at) : undefined,
      });
    });
  } catch (e) {
    console.error("sitemap error", e);
  }

  return urls;
}
