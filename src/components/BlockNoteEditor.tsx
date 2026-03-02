"use client";

import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";
import { useEffect, useRef } from "react";

type Props = {
  value: string; // JSON string
  onChange: (json: string) => void;
};

const defaultDoc = [
  {
    type: "paragraph",
    content: [],
  },
];

export default function BlockNoteEditor({ value, onChange }: Props) {
  const editor = useCreateBlockNote({
    initialContent: safeParse(value),
  });

  const isSyncingRef = useRef(false);

  // push initial content once editor ready
  useEffect(() => {
    if (!editor) return;
    isSyncingRef.current = true;
    const doc = getDoc(editor);
    onChange(JSON.stringify(doc));
    isSyncingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // when value prop changes (e.g., edit existing post), replace content
  useEffect(() => {
    if (!editor) return;
    const parsed = safeParse(value);
    const current = JSON.stringify(getDoc(editor));
    const next = JSON.stringify(parsed);
    if (current === next) return;
    isSyncingRef.current = true;
    editor.replaceBlocks(editor.document, parsed);
    // allow BlockNote to finish replacing blocks before re-enabling change events
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={(ed) => {
          if (isSyncingRef.current) return;
          const doc = getDoc(ed);
          onChange(JSON.stringify(doc));
        }}
      />
    </div>
  );
}

function safeParse(val: string) {
  if (!val) return defaultDoc;
  try {
    const json = JSON.parse(val);
    if (Array.isArray(json)) return json;
    if (json && typeof json === "object") {
      if (Array.isArray((json as any).topLevelBlocks)) return (json as any).topLevelBlocks;
      if (Array.isArray((json as any).document)) return (json as any).document;
      if ((json as any).type === "doc" && Array.isArray((json as any).content)) return (json as any).content;
    }
    return defaultDoc;
  } catch {
    return defaultDoc;
  }
}

function getDoc(ed: any) {
  if (!ed) return defaultDoc;
  if (Array.isArray(ed.topLevelBlocks)) return ed.topLevelBlocks;
  if (Array.isArray(ed.document)) return ed.document;
  return defaultDoc;
}
