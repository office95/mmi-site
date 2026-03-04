const site = process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at";

export default function Head() {
  const title = "Extremkurse | Music Mission Institute";
  const description = "Extremkurse mit maximaler Praxis: kurze, intensive Trainings für Musikproduktion und Tontechnik.";
  const ogImage = "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/dc09c738-147b-44ad-8f10-0a7b19c2cc8a.webp";
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={`${site}/extremkurs`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </>
  );
}
