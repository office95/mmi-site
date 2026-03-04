const site = process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at";

export default function Head() {
  const title = "Intensiv-Ausbildungen | Music Mission Institute";
  const description = "Berufsbegleitende Intensiv-Ausbildungen in Musikproduktion, Tontechnik und Live-Sound in AT & DE.";
  const ogImage = "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/12fd07d0-64ea-40d8-8ef7-a7961b9512fa.webp";
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={`${site}/intensiv`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </>
  );
}
