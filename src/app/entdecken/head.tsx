const site = process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at";

export default function Head() {
  const title = "Entdecken | Alle Kurstermine | Music Mission Institute";
  const description = "Finde deinen nächsten Termin – Kurse in Musikproduktion, Tontechnik und DJing in AT & DE.";
  const ogImage = "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/b4f50227-9cbd-44d9-8947-2afdf30e801d.webp";
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={`${site}/entdecken`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </>
  );
}
