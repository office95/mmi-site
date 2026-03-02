"use client";

import { useState } from "react";

type Slide = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  position: number | null;
  is_active: boolean | null;
};

type Props = {
  initialSlides: Slide[];
};

export function AdminHeroManager({ initialSlides }: Props) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides ?? []);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refreshOrder = async (next: Slide[]) => {
    setSlides(next);
    await fetch("/api/admin/hero/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: next.map((s, idx) => ({ id: s.id, position: idx })),
      }),
    });
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = slides.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[idx], next[target]] = [next[target], next[idx]];
    refreshOrder(next);
  };

  const onDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    await fetch(`/api/admin/hero/delete?id=${id}`, { method: "DELETE" });
    setSlides((prev) => prev.filter((s) => s.id !== id));
    setLoading(false);
  };

  const onUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    if (subtitle) form.append("subtitle", subtitle);
    form.append("position", String(slides.length));

    const res = await fetch("/api/admin/hero/upload", {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error || "Upload fehlgeschlagen");
    } else if (data?.slide) {
      setSlides((prev) => [...prev, data.slide]);
      setFile(null);
      setTitle("");
      setSubtitle("");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 grid gap-4 sm:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">Bild hochladen</label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-50">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            {file ? (
              <span className="font-semibold text-slate-800">{file.name}</span>
            ) : (
              <>
                <span className="font-semibold text-slate-800">Datei auswählen oder hier ablegen</span>
                <span className="text-xs text-slate-500">WebP/JPG, max. ~5-8 MB empfohlen</span>
              </>
            )}
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Titel (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Subtitel (optional)"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={onUpload}
            disabled={loading || !file}
            className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? "Lädt..." : "Hochladen & speichern"}
          </button>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800 mb-2">Hinweis</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Optimale Größe: 1800x1000, WebP oder JPG.</li>
            <li>Bilder werden öffentlich ausgeliefert (Hero).</li>
            <li>Position definiert die Reihenfolge im Slider.</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Slides ({slides.length})</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((s, idx) => (
            <div key={s.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="aspect-[16/9] relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image_url} alt={s.title ?? "Slide"} className="h-full w-full object-cover" />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span># {idx + 1}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => move(s.id, -1)}
                      className="rounded-full border border-slate-200 px-2 py-1 hover:bg-slate-100"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(s.id, 1)}
                      className="rounded-full border border-slate-200 px-2 py-1 hover:bg-slate-100"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <div className="font-semibold text-slate-800">{s.title || "Ohne Titel"}</div>
                <div className="text-sm text-slate-600 line-clamp-2">{s.subtitle}</div>
                <div className="pt-2">
                  <button
                    onClick={() => onDelete(s.id)}
                    disabled={loading}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
