"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ClientBlockNote from "./viewer";

type Post = {
  id: string;
  title: string;
  slug: string;
  created_at?: string | null;
  updated_at?: string | null;
  excerpt?: string | null;
  cover_image_url?: string | null;
  content?: string | null;
  tags?: string[];
  category?: string | null;
};

const toUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/${path.replace(/^\/+/, "")}`;
};

export default function BlogPreviewClient() {
  const sp = useSearchParams();
  const id = sp.get("id") || undefined;
  const slug = sp.get("slug") || undefined;
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<{ name?: string; bio?: string; avatar?: string; category?: string } | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (id) params.append("id", id);
        if (slug) params.append("slug", slug);
        const res = await fetch(`/api/blog/preview?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error ?? `Fehler ${res.status}`);
        } else {
          const { blocks, meta } = parseContent(json.data?.content);
          setMeta(meta ?? null);
          setCategory((meta as any)?.category ?? json.data?.category ?? null);
          setPost({ ...json.data, content: JSON.stringify(blocks) });
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-800">
        <p>Lade Vorschau…</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-red-600">
        <p>{error ?? "Nicht gefunden"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Vorschau · {post.updated_at ? new Date(post.updated_at).toLocaleString("de-AT") : ""}
          </p>
          <h1 className="text-3xl sm:text-4xl font-anton leading-tight">{post.title}</h1>
          {category && <p className="text-sm text-slate-600">Kategorie: {category}</p>}
          {post.tags?.length ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {post.tags.map((t) => (
                <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  #{t}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {post.cover_image_url ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={toUrl(post.cover_image_url) ?? ""} alt={post.title} className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="prose prose-slate max-w-none">
          <ClientBlockNote json={post.content ?? "[]"} />
        </div>
      </div>
    </div>
  );
}
