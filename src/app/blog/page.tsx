import { getSupabaseServiceClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const toUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/${path.replace(/^\/+/, "")}`;
};

export default async function BlogListPage() {
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("posts")
    .select("id,title,slug,excerpt,cover_image_url,published_at,tags")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  const posts = data ?? [];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 py-12 space-y-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Blog</p>
          <h1 className="font-anton text-4xl sm:text-5xl">Insights & Stories</h1>
        </div>

        {posts.length === 0 ? (
          <p className="text-slate-500">Noch keine Beiträge.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group rounded-2xl border border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg transition overflow-hidden">
                <div className="relative h-48 w-full bg-slate-100">
                  {p.cover_image_url ? (
                    <Image src={toUrl(p.cover_image_url) ?? p.cover_image_url} alt={p.title} fill className="object-cover group-hover:scale-105 transition duration-300" sizes="400px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400 text-sm">Kein Bild</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString("de-AT") : ""}
                  </p>
                  <h2 className="font-anton text-xl leading-tight text-slate-900">{p.title}</h2>
                  {p.excerpt ? <p className="text-sm text-slate-600 line-clamp-2">{p.excerpt}</p> : null}
                  {p.tags && p.tags.length ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {p.tags.slice(0, 3).map((t: string) => (
                        <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
