"use client";

import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";
import { useMemo } from "react";

type Props = {
  json: string;
};

export default function BlockNoteViewerClient({ json }: Props) {
  const content = useMemo(() => parseJson(json), [json]);
  const editor = useCreateBlockNote({
    initialContent: content,
  });

  if (!editor) return null;

  return (
    <div className="bn-viewer rounded-2xl border border-slate-200 bg-white shadow-sm">
      <BlockNoteView editor={editor} editable={false} theme="light" />
    </div>
  );
}

function parseJson(value: string) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).blocks)) {
      return (parsed as any).blocks;
    }
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") {
      if (Array.isArray((parsed as any).topLevelBlocks)) return (parsed as any).topLevelBlocks;
      if (Array.isArray((parsed as any).content)) return (parsed as any).content;
      if (Array.isArray((parsed as any).document)) return (parsed as any).document;
    }
  } catch {
    /* ignore */
  }
  return [];
}
