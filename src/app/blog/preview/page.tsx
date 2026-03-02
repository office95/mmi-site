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
};

const toUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/${path.replace(/^\/+/, "")}`;
};

export default function BlogPreviewPage() {
  const sp = useSearchParams();
  const id = sp.get("id") || undefined;
  const slug = sp.get("slug") || undefined;
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<{ name?: string; bio?: string; avatar?: string } | null>(null);
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
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-800">
        <p>Beitrag konnte nicht geladen werden (slug: {slug || "(leer)"}, id: {id || "(leer)"}). {error ?? ""}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-[28px] shadow-[0_18px_50px_rgba(15,23,42,0.08)] border border-slate-100 overflow-hidden">
          <div className="px-6 sm:px-10 pt-10 pb-8 space-y-6">
            <header className="space-y-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500 flex flex-wrap gap-3">
            <span>Vorschau</span>
            {post.created_at ? <span>· {new Date(post.created_at).toLocaleDateString("de-AT")}</span> : null}
            {post.content ? <span>· {computeReadingTime(post.content)} Min. Lesezeit</span> : null}
            {category ? <span>· {category}</span> : null}
          </div>
              <h1 className="font-anton text-4xl sm:text-5xl leading-tight">{post.title}</h1>
              {post.excerpt ? <p className="text-slate-600 text-base leading-relaxed">{post.excerpt}</p> : null}
              {post.tags && post.tags.length ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {post.tags.map((t) => (
                    <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      #{t}
                    </span>
                  ))}
                </div>
              ) : null}
            </header>

            {post.cover_image_url ? (
              <figure className="w-full">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={toUrl(post.cover_image_url) ?? post.cover_image_url} alt={post.title} className="h-full w-full object-cover" />
                </div>
              </figure>
            ) : null}

            <div className="prose prose-slate max-w-none text-slate-800">
              {post.content ? <ClientBlockNote json={post.content} /> : <p className="text-slate-500">Kein Inhalt.</p>}
            </div>
          </div>

          {meta?.name || meta?.bio || meta?.avatar ? (
            <div className="px-6 sm:px-10 pb-10">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6 flex gap-4 sm:gap-5 items-center">
                {meta?.avatar ? (
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden bg-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={toUrl(meta.avatar) ?? meta.avatar} alt={meta.name ?? "Autor"} className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="space-y-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Über den Dozenten</p>
                  {meta?.name ? <p className="text-lg font-semibold leading-tight text-slate-900">{meta.name}</p> : null}
                  {meta?.bio ? <p className="text-sm leading-relaxed text-slate-700">{meta.bio}</p> : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}

function parseContent(raw: any): { blocks: any[]; meta?: { name?: string; bio?: string; avatar?: string } } {
  if (!raw) return { blocks: [] };
  try {
    const json = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(json)) return { blocks: json };
    if (json && typeof json === "object") {
      if (Array.isArray((json as any).blocks)) {
        return { blocks: (json as any).blocks, meta: (json as any).meta };
      }
      if (Array.isArray((json as any).content)) return { blocks: (json as any).content };
      if (Array.isArray((json as any).document)) return { blocks: (json as any).document };
    }
  } catch {
    return { blocks: [] };
  }
  return { blocks: [] };
}

function computeReadingTime(contentJson: string): number | null {
  if (!contentJson) return null;
  try {
    const json = JSON.parse(contentJson);
    const blocks = Array.isArray(json) ? json : json?.blocks || json?.content || [];
    const text = Array.isArray(blocks) ? blocks.map(extractText).join(" ") : "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return words ? Math.max(1, Math.ceil(words / 200)) : null;
  } catch {
    return null;
  }
}

function extractText(node: any): string {
  if (!node) return "";
  if (node.type === "text" && typeof node.text === "string") return node.text;
  if (Array.isArray(node.content)) return node.content.map(extractText).join(" ");
  return "";
}
