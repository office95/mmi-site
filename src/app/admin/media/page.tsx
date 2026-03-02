"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpFromLine,
  Check,
  Copy,
  Image as ImageIcon,
  Loader2,
  RefreshCcw,
  Trash2,
  Video,
} from "lucide-react";

export default function MediaUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState("");
  const [alt, setAlt] = useState("");
  const [files, setFiles] = useState<
    { name: string; url: string; size: number | null; created_at: string; title?: string | null; alt?: string | null }[]
  >([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setResultUrl(null);
    setError(null);
  };

  const onUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setResultUrl(null);
    setCopied(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);
      if (alt || title) formData.append("alt", alt || title);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen");
      setResultUrl(data.url);
      setFiles((prev) => [
        ...prev,
        {
          name: data.path ?? file.name,
          url: data.url,
          size: file.size,
          created_at: new Date().toISOString(),
          title: title || null,
          alt: alt || title || null,
        },
      ]);
      setTitle("");
      setAlt("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unbekannter Fehler");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const loadList = async () => {
    setIsLoadingList(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/media/list");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Laden");
      setFiles(data.files ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsLoadingList(false);
    }
  };

  const deleteFile = async (name: string) => {
    if (!confirm("Wirklich löschen?")) return;
    try {
      const res = await fetch("/api/admin/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Löschen fehlgeschlagen");
      setFiles((prev) => prev.filter((f) => f.name !== name));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#fff5fb] to-[#f3f5ff] text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="tag">Admin</p>
            <h1 className="text-3xl font-semibold">Medien hochladen</h1>
            <p className="text-sm text-slate-500">Optimiert für Bilder (WEBP) und Videos. URLs werden sofort bereitgestellt.</p>
          </div>
          <button
            onClick={loadList}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-[#ff1f8f] hover:text-[#ff1f8f]"
          >
            <RefreshCcw size={14} /> Reload
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_2fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <ArrowUpFromLine className="h-5 w-5 text-[#ff1f8f]" />
              <div>
                <p className="text-sm font-semibold">Upload</p>
                <p className="text-xs text-slate-500">Drag & Drop oder Datei wählen</p>
              </div>
            </div>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={onFileChange}
                className="w-full text-sm text-slate-800 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-2 file:text-slate-800 hover:file:border-[#ff1f8f]"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Titel</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#ff1f8f] focus:outline-none"
                    placeholder="Hero Bild"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Alt-Text (SEO)</label>
                  <input
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#ff1f8f] focus:outline-none"
                    placeholder="Beschreibung"
                  />
                </div>
              </div>

              <button
                onClick={onUpload}
                disabled={isUploading || !file}
                className="w-full rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-black shadow-md shadow-[#ff1f8f]/30 hover:bg-[#e40073] disabled:opacity-60"
              >
                {isUploading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Lädt …
                  </span>
                ) : (
                  "Hochladen & URL kopieren"
                )}
              </button>
              {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              {resultUrl && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="line-clamp-2 break-all text-xs text-slate-700">{resultUrl}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(resultUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1200);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#ff1f8f] hover:text-[#ff1f8f]"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-[#ff1f8f]" />
                <h2 className="text-lg font-semibold">Uploads</h2>
              </div>
              <button
                onClick={loadList}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-[#ff1f8f] hover:text-[#ff1f8f]"
              >
                <RefreshCcw size={14} /> Liste neu laden
              </button>
            </div>
            {isLoadingList ? (
              <div className="py-8 text-center text-slate-500 text-sm">Lade…</div>
            ) : (
              <div className="space-y-3">
                {files.length === 0 && <p className="text-slate-500">Noch keine Dateien geladen.</p>}
                <div className="grid gap-3 md:grid-cols-2">
                  {files.map((f) => (
                    <div
                      key={f.name}
                      className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800 flex gap-3 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center">
                        {/\.(mp4|mov|webm)$/i.test(f.name) ? (
                          <Video className="h-6 w-6 text-slate-500" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f.url} alt={f.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold break-all">{f.name}</p>
                        {f.title && <p className="text-xs text-slate-600">Titel: {f.title}</p>}
                        {f.alt && <p className="text-xs text-slate-600">Alt: {f.alt}</p>}
                        <p className="text-xs text-slate-500">
                          {(f.size ?? 0) > 0 ? `${((f.size ?? 0) / 1024 / 1024).toFixed(2)} MB` : ""}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="line-clamp-2 break-all text-xs text-slate-600">{f.url}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(f.url)}
                            className="rounded-full border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#ff1f8f] hover:text-[#ff1f8f]"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => deleteFile(f.name)}
                            className="rounded-full border border-red-300 px-2 py-1 text-[11px] font-semibold text-red-600 hover:border-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
