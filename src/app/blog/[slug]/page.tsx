import { getSupabaseServiceClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import LinkExt from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import YoutubeExt from "@tiptap/extension-youtube";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import ClientBlockNote from "./viewer";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: { slug: string } };

const toUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  // strip leading slashes without escaping issues in turbopack
  return `${base}/storage/v1/object/public/${path.replace(/^[/]+/, "")}`;
};

export default async function BlogDetailPage({ params }: Params) {
  const supabase = getSupabaseServiceClient();

  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", params.slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) return notFound();

  const { blocks, meta } = parseContent(data.content);
  const readingTime = computeReadingTime(blocks);
  const category = meta?.category ?? data.category;

  let htmlContent: string | null = null;
  let isBlocknote = Array.isArray(blocks);
  if (!isBlocknote && data.content) {
    try {
      const json = JSON.parse(data.content);
      if (json && json.type === "doc") {
        htmlContent = generateHTML(json, [StarterKit, LinkExt, ImageExt, YoutubeExt, HorizontalRule]);
      }
    } catch {
      htmlContent = null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-[28px] shadow-[0_18px_50px_rgba(15,23,42,0.08)] border border-slate-100 overflow-hidden">
          <div className="px-6 sm:px-10 pt-10 pb-8 space-y-6">
            <header className="space-y-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500 flex flex-wrap gap-3">
            <span>{data.published_at ? new Date(data.published_at).toLocaleDateString("de-AT") : ""}</span>
            {readingTime ? <span>· {readingTime} Min. Lesezeit</span> : null}
            {category ? <span>· {category}</span> : null}
          </div>
              <h1 className="font-anton text-4xl sm:text-5xl leading-tight">{data.title}</h1>
              {data.excerpt ? <p className="text-slate-600 text-base leading-relaxed">{data.excerpt}</p> : null}
              {data.tags && data.tags.length ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {data.tags.map((t: string) => (
                    <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      #{t}
                    </span>
                  ))}
                </div>
              ) : null}
            </header>

            {data.cover_image_url ? (
              <figure className="w-full">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100">
                  <Image src={toUrl(data.cover_image_url) ?? data.cover_image_url} alt={data.title} fill className="object-cover" sizes="900px" />
                </div>
              </figure>
            ) : null}

            <div className="prose prose-slate max-w-none text-slate-800">
              {htmlContent ? (
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
              ) : isBlocknote && data.content ? (
                <ClientBlockNote json={data.content} />
              ) : data.content ? (
                <ReactMarkdown>{data.content}</ReactMarkdown>
              ) : (
                <p className="text-slate-500">Kein Inhalt.</p>
              )}
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

function computeReadingTime(blocks: any[]): number | null {
  if (!blocks || !blocks.length) return null;
  const text = blocks.map(extractText).join(" ");
  const words = text.trim().split(/\\s+/).filter(Boolean).length;
  if (!words) return null;
  return Math.max(1, Math.ceil(words / 200));
}

function extractText(node: any): string {
  if (!node) return "";
  if (node.type === "text" && typeof node.text === "string") return node.text;
  if (Array.isArray(node.content)) return node.content.map(extractText).join(" ");
  return "";
}
