import type { MetadataRoute } from "next";
import { getSupabaseServiceClient } from "@/lib/supabase";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseServiceClient();

  const urls: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date() },
    { url: `${BASE_URL}/entdecken`, lastModified: new Date() },
    { url: `${BASE_URL}/kursstandorte`, lastModified: new Date() },
    { url: `${BASE_URL}/professional-audio-diploma`, lastModified: new Date() },
  ];

  try {
    const [{ data: courses }, { data: partners }] = await Promise.all([
      supabase.from("courses").select("slug, updated_at"),
      supabase.from("partners").select("slug, updated_at"),
    ]);

    (courses ?? []).forEach((c) => {
      if (!c.slug) return;
      urls.push({
        url: `${BASE_URL}/kurs/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
      });
    });

    (partners ?? []).forEach((p) => {
      if (!p.slug) return;
      urls.push({
        url: `${BASE_URL}/partner/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      });
    });
  } catch (e) {
    console.error("sitemap error", e);
  }

  return urls;
}
