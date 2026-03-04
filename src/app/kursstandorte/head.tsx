const site = process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at";

export default function Head() {
  const title = "Kursstandorte | Music Mission Institute";
  const description = "Alle Standorte und Partner des Music Mission Institute in Österreich und Deutschland.";
  const ogImage = "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/b4f50227-9cbd-44d9-8947-2afdf30e801d.webp";
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={`${site}/kursstandorte`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </>
  );
}
