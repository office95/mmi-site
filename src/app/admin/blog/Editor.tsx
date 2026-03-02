"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const BlockNoteEditor = dynamic(() => import("@/components/BlockNoteEditor"), { ssr: false });

type Post = {
  id?: string;
  title: string;
  slug: string;
  status: string;
  cover_image_url?: string | null;
  excerpt?: string | null;
  content?: string | null; // stores TipTap JSON string
  tags?: string[];
  author_type?: string;
  author_partner_id?: string | null;
  author_name?: string | null;
  author_bio?: string | null;
  author_avatar_url?: string | null;
  category?: string | null;
};

export function BlogEditor({ postId, initialPost }: { postId?: string; initialPost?: Post }) {
  const router = useRouter();
  const [resolvedPostId, setResolvedPostId] = useState<string | null>(postId ?? initialPost?.id ?? null);
  const [resolvedSlug, setResolvedSlug] = useState<string>(initialPost?.slug ?? postId ?? "");
  const [post, setPost] = useState<Post>({
    title: "",
    slug: "",
    status: "draft",
    cover_image_url: "",
    excerpt: "",
    content: "",
    tags: [],
  });
  const [loading, setLoading] = useState<boolean>(!!(postId ?? initialPost?.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSlug, setAutoSlug] = useState(true);
  const [authorName, setAuthorName] = useState<string>("");
  const [authorBio, setAuthorBio] = useState<string>("");
  const [authorAvatar, setAuthorAvatar] = useState<string>("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [category, setCategory] = useState<string>("Musikproduktion");
  const categories = [
    "Musikproduktion",
    "Audio Engineering",
    "DJ & Performance",
    "Workflow & Produktivität",
    "Kurs-Einblicke",
    "Kursorte & Partner",
    "Karriere & Music Business",
  ];

  useEffect(() => {
    // keep ids/slugs in sync with props
    const nextId = postId ?? initialPost?.id ?? null;
    if (nextId && nextId !== resolvedPostId) {
      setResolvedPostId(nextId);
    }
    if (initialPost?.slug && initialPost.slug !== resolvedSlug) {
      setResolvedSlug(initialPost.slug);
    }
  }, [postId, initialPost, resolvedPostId]);

  useEffect(() => {
    // last-resort: grab id from URL path on client
    if (resolvedPostId || typeof window === "undefined") return;
    const parts = window.location.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (last && uuidRegex.test(last)) {
      setResolvedPostId(last);
    }
  }, [resolvedPostId]);

  useEffect(() => {
    if (initialPost) {
      setPost(initialPost);
      if (initialPost.slug) setResolvedSlug(initialPost.slug);
    }
    if (!resolvedPostId) {
      // Neuer Beitrag: kein Fetch nötig
      setError(null);
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/posts/${resolvedPostId}`, { cache: "no-store" });
        const text = await res.text();
        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
        if (res.ok && json?.data) {
          const { contentValue, meta } = extractContentAndMeta(json.data.content);
          setPost({
            ...json.data,
            content: contentValue,
            tags: json.data.tags ?? [],
            category: meta?.category ?? json.data.category ?? category,
          });
          if (meta) {
            setAuthorName(meta.name ?? "");
            setAuthorBio(meta.bio ?? "");
            setAuthorAvatar(meta.avatar ?? "");
            if (meta.category) setCategory(meta.category);
          }
          setError(null);
        } else {
          setError(json?.error ? `${res.status}: ${json.error}` : `Fehler ${res.status}: ${text || "Unbekannter Fehler"}`);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [resolvedPostId, initialPost]);

  const handleSave = async (nextStatus?: string) => {
    if (!post.title?.trim()) {
      setError("Titel ist erforderlich.");
      return;
    }
    if (!post.cover_image_url?.trim()) {
      setError("Cover-Bild ist erforderlich.");
      return;
    }
    if (!authorName.trim()) {
      setError("Autor*in Name ist erforderlich.");
      return;
    }
    if (!authorBio.trim()) {
      setError("Autor*in Bio ist erforderlich.");
      return;
    }
    if (!authorAvatar.trim()) {
      setError("Autor-Bild ist erforderlich.");
      return;
    }
    if (!category) {
      setError("Bitte eine Kategorie wählen.");
      return;
    }
    const blocks = parseBlocks(post.content ?? "");
    if (!blocks.length) {
      setError("Inhalt darf nicht leer sein.");
      return;
    }
    if (!(post.tags ?? []).length) {
      setError("Mindestens ein Tag ist erforderlich.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const slugFinal = post.slug?.trim()
        ? post.slug.trim()
        : slugify(post.title);
      const wrappedContent = wrapContentWithMeta(post.content ?? "", {
        name: authorName,
        bio: authorBio,
        avatar: authorAvatar,
        category,
      });
      const payload = {
        id: post.id,
        title: post.title,
        slug: slugFinal,
        status: nextStatus ?? post.status,
        cover_image_url: post.cover_image_url ?? null,
        excerpt: post.excerpt ?? null,
        content: wrappedContent,
        tags: post.tags ?? [],
        category,
        author_type: post.author_type ?? "admin",
        author_partner_id: post.author_partner_id ?? null,
      };
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) {
        router.push("/admin/blog");
        router.refresh();
      } else {
        setError(json?.error ?? "Fehler beim Speichern");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof Post, value: any) => {
    setPost((p) => ({ ...p, [field]: value }));
  };

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const currentError = error && <p className="text-sm text-rose-600">{error}</p>;

  return (
    <div className="space-y-6 rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-lg shadow-slate-200">
      {loading ? (
        <p className="text-slate-500">Lade…</p>
      ) : (
        <>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <p className="text-xs text-slate-500">
            {resolvedPostId ? `postId: ${resolvedPostId}` : "Neuer Beitrag"}
          </p>
          {resolvedPostId && !post.title && !error && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Keine Daten geladen. Prüfe API /api/admin/posts/{postId} oder berechtigte ID.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-800">Status</span>
              <select
                value={post.status}
                onChange={(e) => update("status", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              >
                <option value="draft">Entwurf</option>
                <option value="pending">Zur Freigabe</option>
                <option value="published">Veröffentlicht</option>
                <option value="rejected">Abgelehnt</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-800">
                Kategorie <span className="text-rose-600">*</span>
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4">
            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-800">
                Titel <span className="text-rose-600">*</span>
              </span>
              <input
                value={post.title}
                onChange={(e) => {
                  const val = e.target.value;
                  update("title", val);
                  if (autoSlug) {
                    update("slug", slugify(val));
                  }
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              />
            </label>
            {/* Slug wird automatisch erzeugt und bleibt verborgen */}
            <input
              type="hidden"
              value={post.slug}
              onChange={(e) => update("slug", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <span className="text-sm font-semibold text-slate-800">
              Cover-Bild hochladen <span className="text-rose-600">*</span>
            </span>
            <input
              value={post.cover_image_url ?? ""}
              onChange={(e) => update("cover_image_url", e.target.value)}
              placeholder=""
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
            />
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#ff1f8f] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#e40073]">
                  Datei auswählen
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        setError("Cover: max. 5MB");
                        return;
                      }
                      uploadImage(file, 5, (url) => update("cover_image_url", url), setUploadingCover);
                    }}
                  />
                </label>
                {uploadingCover && <span className="text-xs text-slate-500">Lade hoch…</span>}
              </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-semibold text-slate-800">
              Inhalt <span className="text-rose-600">*</span>
            </span>
            <BlockNoteEditor value={post.content ?? ""} onChange={(json) => update("content", json)} />
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Über den Autor</p>
            <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-800">
                Autor*in Name <span className="text-rose-600">*</span>
              </span>
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-semibold text-slate-800">
                Autor*in Bio <span className="text-rose-600">*</span>
              </span>
              <input
                value={authorBio}
                onChange={(e) => setAuthorBio(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-semibold text-slate-800">
                Autor-Bild hochladen <span className="text-rose-600">*</span>
              </span>
              <input
                value={authorAvatar}
                onChange={(e) => setAuthorAvatar(e.target.value)}
                placeholder=""
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#ff1f8f] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#e40073]">
                  Datei auswählen
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        setError("Autor-Bild: max. 2MB");
                        return;
                      }
                      uploadImage(file, 2, setAuthorAvatar, setUploadingAvatar);
                    }}
                  />
                </label>
                {uploadingAvatar && <span className="text-xs text-slate-500">Lade hoch…</span>}
              </div>
            </label>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-semibold text-slate-800">
              Tags <span className="text-rose-600">*</span>
            </span>
            <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 px-3 py-2 bg-white">
              {(post.tags ?? []).map((tag, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {tag}
                  <button
                    type="button"
                    className="text-slate-500 hover:text-rose-600"
                    onClick={() => update("tags", (post.tags ?? []).filter((_, i) => i !== idx))}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Tag hinzufügen"
                className="flex-1 min-w-[120px] border-0 focus:outline-none text-sm"
                onKeyDown={(e) => {
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    if (!value) return;
                    const next = Array.from(new Set([...(post.tags ?? []), value]));
                    update("tags", next);
                    (e.target as HTMLInputElement).value = "";
                  }
                  if (e.key === "Backspace" && !value && (post.tags ?? []).length) {
                    const next = [...(post.tags ?? [])];
                    next.pop();
                    update("tags", next);
                  }
                }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="rounded-full bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#e40073] disabled:opacity-60"
            >
              Speichern
            </button>
            <button
              onClick={() => handleSave("published")}
              disabled={saving}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
            >
              Speichern & Veröffentlichen
            </button>
            <button
              type="button"
              onClick={() => {
                const slug = (post.slug || resolvedSlug || slugify(post.title || "") || "preview").trim() || "preview";
                const id = post.id || resolvedPostId;
                const url = `/blog/preview?slug=${encodeURIComponent(slug)}${id ? `&id=${id}` : ""}&preview=1`;
                window.open(url, "_blank");
              }}
              disabled={saving || !(post.slug || post.title || resolvedSlug || post.id || resolvedPostId)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
            >
              Vorschau
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Helpers to store author meta inside content JSON to avoid schema changes
function extractContentAndMeta(raw: any): {
  contentValue: string;
  meta?: { name?: string; bio?: string; avatar?: string; category?: string };
} {
  if (!raw) return { contentValue: "" };
  if (typeof raw === "string") {
    try {
      const json = JSON.parse(raw);
      if (json && typeof json === "object" && Array.isArray(json.blocks)) {
        return {
          contentValue: JSON.stringify(json.blocks),
          meta: {
            name: json.meta?.name,
            bio: json.meta?.bio,
            avatar: json.meta?.avatar,
            category: json.meta?.category,
          },
        };
      }
      return { contentValue: raw };
    } catch {
      return { contentValue: raw };
    }
  }
  // object or array
  if (raw && typeof raw === "object" && Array.isArray(raw.blocks)) {
    return {
      contentValue: JSON.stringify(raw.blocks),
      meta: {
        name: raw.meta?.name,
        bio: raw.meta?.bio,
        avatar: raw.meta?.avatar,
        category: raw.meta?.category,
      },
    };
  }
  try {
    return { contentValue: JSON.stringify(raw) };
  } catch {
    return { contentValue: "" };
  }
}

function wrapContentWithMeta(raw: string, meta: { name?: string; bio?: string; avatar?: string; category?: string }) {
  const blocks = parseBlocks(raw);
  return JSON.stringify({ meta, blocks });
}

function parseBlocks(raw: string) {
  if (!raw) return [];
  try {
    const json = JSON.parse(raw);
    if (Array.isArray(json)) return json;
  } catch {
    return [];
  }
  return [];
}

async function uploadImage(file: File, maxMB: number, onDone: (url: string) => void, setLoading: (v: boolean) => void, title?: string) {
  setLoading(true);
  try {
    if (file.size > maxMB * 1024 * 1024) throw new Error(`Max ${maxMB}MB`);
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `Upload fehlgeschlagen (${res.status})`);
    onDone(json.url);
  } catch (e: any) {
    console.error(e);
    alert(e.message || "Upload fehlgeschlagen");
  } finally {
    setLoading(false);
  }
}
