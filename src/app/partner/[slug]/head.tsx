import { getSupabaseServiceClient } from "@/lib/supabase";
import { fetchSeoForPage, resolvedSeoToMetadata } from "@/lib/seo-matrix";

type Props = { params: { slug: string } };

const toUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/${path.replace(/^\/+/, "")}`;
};

export default async function Head({ params }: Props) {
  const supabase = getSupabaseServiceClient();
  const slug = params?.slug;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at";

  const { data: partner } = slug
    ? await supabase
        .from("partners")
        .select("name,city,state,country,hero1_path,slug")
        .eq("slug", slug)
        .maybeSingle()
    : { data: null };

  const defaults = {
    pageKey: "partner-template",
    defaultSlug: `/partner/${slug}`,
    defaultTitle: partner ? `${partner.name} | Partner | Music Mission Institute` : "Partner | Music Mission Institute",
    defaultDescription: partner
      ? `${partner.name} – Partnerstandort${partner.city ? " in " + partner.city : ""}.`
      : "Partnerstandort bei Music Mission.",
    defaultH1: partner?.name || "Partner",
    defaultHeroSubline: partner?.city ? `${partner.city}${partner.state ? ", " + partner.state : ""}` : undefined,
  };

  const seo = await fetchSeoForPage(defaults, {
    slug: `/partner/${partner?.slug || slug}`,
    title: defaults.defaultTitle,
    description: defaults.defaultDescription,
    h1: partner?.name,
    heroSubline: defaults.defaultHeroSubline,
  });
  const meta = resolvedSeoToMetadata(seo);
  const image = partner?.hero1_path ? toUrl(partner.hero1_path) : null;

  const breadcrumb =
    partner && slug
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Startseite", item: site },
            { "@type": "ListItem", position: 2, name: "Partner", item: `${site}/kursstandorte` },
            { "@type": "ListItem", position: 3, name: partner.name, item: `${site}/partner/${partner.slug}` },
          ],
        }
      : null;

  const languages = meta.alternates?.languages as Record<string, string> | undefined;

  return (
    <>
      <title>{meta.title as string}</title>
      {meta.description ? <meta name="description" content={meta.description} /> : null}
      {meta.robots
        ? typeof meta.robots === "string"
          ? <meta name="robots" content={meta.robots} />
          : (
            <meta
              name="robots"
              content={`${meta.robots.index ? "index" : "noindex"}, ${meta.robots.follow ? "follow" : "nofollow"}`}
            />
          )
        : null}
      {meta.alternates?.canonical ? <link rel="canonical" href={meta.alternates.canonical as string} /> : null}
      {languages
        ? Object.entries(languages).map(([locale, href]) => (
            <link key={locale} rel="alternate" hrefLang={locale} href={href} />
          ))
        : null}

      <meta property="og:title" content={(meta.openGraph?.title as string) || (meta.title as string)} />
      {meta.openGraph?.description ? <meta property="og:description" content={meta.openGraph.description as string} /> : null}
      <meta property="og:type" content={meta.openGraph?.type || "website"} />
      {meta.openGraph?.url ? <meta property="og:url" content={meta.openGraph.url as string} /> : null}
      {image ? <meta property="og:image" content={image} /> : null}

      <meta name="twitter:card" content={meta.twitter?.card || "summary_large_image"} />
      <meta name="twitter:title" content={(meta.twitter?.title as string) || (meta.title as string)} />
      {meta.twitter?.description ? <meta name="twitter:description" content={meta.twitter.description as string} /> : null}
      {image ? <meta name="twitter:image" content={image} /> : null}

      {breadcrumb ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} /> : null}
    </>
  );
}
