import { getSupabaseServiceClient } from "@/lib/supabase";

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
  let title = "Partner | Music Mission Institute";
  let description = "Standorte und Partner des Music Mission Institute.";
  let image: string | null = null;

  if (slug) {
    try {
      const { data } = await supabase
        .from("partners")
        .select("name,city,state,hero1_path,slug")
        .eq("slug", slug)
        .maybeSingle();
      if (data?.name) {
        title = `${data.name} | Music Mission Institute`;
        const loc = [data.city, data.state].filter(Boolean).join(" • ");
        description = loc ? `${data.name} – Standort ${loc}` : `${data.name} – Partnerstandort des Music Mission Institute.`;
        image = data.hero1_path ? toUrl(data.hero1_path) : null;
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {image ? <meta property="og:image" content={image} /> : null}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image ? <meta name="twitter:image" content={image} /> : null}
    </>
  );
}
