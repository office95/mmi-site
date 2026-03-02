"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";

const BlockNoteEditor = dynamic(() => import("@/components/BlockNoteEditor"), { ssr: false });
async function uploadImage(file: File, maxMB: number, onDone: (url: string) => void, onError: (msg: string) => void, setLoading: (v: boolean) => void) {
  setLoading(true);
  try {
    if (file.size > maxMB * 1024 * 1024) throw new Error(`Max ${maxMB}MB`);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Upload fehlgeschlagen");
    onDone(json.url);
  } catch (e: any) {
    console.error(e);
    onError(e.message || "Upload fehlgeschlagen");
  } finally {
    setLoading(false);
  }
}

export default function PartnerBlogCreateClient() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get("token") ?? "";
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState("Musikproduktion");
  const [authorName, setAuthorName] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [authorAvatar, setAuthorAvatar] = useState("");
  const categories = [
    "Musikproduktion",
    "Audio Engineering",
    "DJ & Performance",
    "Workflow & Produktivität",
    "Kurs-Einblicke",
    "Kursorte & Partner",
    "Karriere & Music Business",
  ];
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/blog/partner/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          title,
          cover_image_url: cover || null,
          content,
          tags,
          category,
          author_name: authorName,
          author_bio: authorBio,
          author_avatar_url: authorAvatar,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setMsg("Gespeichert. Der Beitrag ist jetzt zur Freigabe beim Admin.");
        setTitle("");
        setCover("");
        setContent("");
        setTags([]);
        setAuthorName("");
        setAuthorBio("");
        setAuthorAvatar("");
        setCategory("Musikproduktion");
        router.refresh();
      } else {
        setErr(json?.error ?? "Fehler beim Speichern");
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <p className="text-slate-600">Token fehlt. Bitte den Magic-Link verwenden.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Partner</p>
          <h1 className="font-anton text-3xl">Blogpost erstellen</h1>
          <p className="text-slate-600">Dein Beitrag wird nach Freigabe durch den Admin veröffentlicht.</p>
        </div>

        {err && <p className="text-sm text-rose-600">{err}</p>}
        {msg && <p className="text-sm text-emerald-600">{msg}</p>}

        <div className="space-y-4">
          <label className="space-y-1 block">
            <span className="text-sm font-semibold text-slate-800">Titel</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 block">
              <span className="text-sm font-semibold text-slate-800">Kategorie</span>
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
            <div className="space-y-1">
              <span className="text-sm font-semibold text-slate-800">Cover-Bild</span>
              <input
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="https://..."
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
                      uploadImage(
                        file,
                        5,
                        (url) => setCover(url),
                        (msg) => setErr(msg),
                        setUploadingCover
                      );
                    }}
                  />
                </label>
                {uploadingCover && <span className="text-xs text-slate-500">Lade hoch…</span>}
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1 block sm:col-span-1">
              <span className="text-sm font-semibold text-slate-800">Autor*in Name</span>
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1 block sm:col-span-2">
              <span className="text-sm font-semibold text-slate-800">Autor*in Bio</span>
              <input
                value={authorBio}
                onChange={(e) => setAuthorBio(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1 block sm:col-span-1">
              <span className="text-sm font-semibold text-slate-800">Autor-Bild</span>
              <input
                value={authorAvatar}
                onChange={(e) => setAuthorAvatar(e.target.value)}
                placeholder="https://..."
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
                      uploadImage(
                        file,
                        2,
                        (url) => setAuthorAvatar(url),
                        (msg) => setErr(msg),
                        setUploadingAvatar
                      );
                    }}
                  />
                </label>
                {uploadingAvatar && <span className="text-xs text-slate-500">Lade hoch…</span>}
              </div>
            </label>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-slate-800">Inhalt</span>
            <BlockNoteEditor value={content} onChange={setContent} />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-slate-800">Tags</span>
            <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 px-3 py-2 bg-white">
              {tags.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {tag}
                  <button
                    type="button"
                    className="text-slate-500 hover:text-rose-600"
                    onClick={() => setTags(tags.filter((_, i) => i !== idx))}
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
                    const next = Array.from(new Set([...tags, value]));
                    setTags(next);
                    (e.target as HTMLInputElement).value = "";
                  }
                  if (e.key === "Backspace" && !(e.target as HTMLInputElement).value && tags.length) {
                    setTags(tags.slice(0, -1));
                  }
                }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-[#ff1f8f] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#e40073] disabled:opacity-60"
        >
          Absenden
        </button>
      </div>
    </div>
  );
}
