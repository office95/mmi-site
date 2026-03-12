"use client";

import { useCallback, useEffect, useState } from "react";
import { CopyIcon, Share2 } from "lucide-react";

type Props = {
  url: string;
  label?: string;
  compact?: boolean;
};

export function ShareButton({ url, label = "Teilen", compact }: Props) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  const doShare = useCallback(async () => {
    const shareUrl = url;
    const title = "Music Mission Institute";
    const text = label || "Kurs teilen";
    if (canNativeShare) {
      try {
        await navigator.share({ url: shareUrl, title, text });
        return;
      } catch (_) {
        // Fallback auf Copy
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (_) {
      setCopied(false);
    }
  }, [canNativeShare, label, url]);

  return (
    <button
      type="button"
      onClick={doShare}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        compact ? "border-slate-200 text-slate-700 bg-white hover:bg-slate-50" : "border-slate-200 text-slate-800 bg-white hover:bg-slate-50"
      }`}
      aria-label={label}
    >
      {copied ? (
        <>
          <CopyIcon size={14} className="text-pink-600" />
          <span className="text-pink-600">Link kopiert</span>
        </>
      ) : (
        <>
          <Share2 size={14} className="text-pink-600" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
