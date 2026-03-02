"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { useEffect } from "react";

type Props = {
  value: string; // JSON string
  onChange: (json: string) => void;
};

export function TipTapEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: true, autolink: true }),
      Image.configure({ inline: false, allowBase64: true }),
      Youtube.configure({
        inline: false,
        modestBranding: true,
      }),
      HorizontalRule,
      Placeholder.configure({
        placeholder: "Schreib hier deinen Beitrag...",
      }),
    ],
    content: safeParse(value),
    onUpdate({ editor }) {
      onChange(JSON.stringify(editor.getJSON()));
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const parsed = safeParse(value);
    editor.commands.setContent(parsed);
  }, [value, editor]);

  if (!editor) return null;

  const addImage = () => {
    const url = prompt("Bild URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };
  const addVideo = () => {
    const url = prompt("YouTube oder Vimeo URL");
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
  };
  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = prompt("Link URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
        <ToolbarButton action={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          B
        </ToolbarButton>
        <ToolbarButton action={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          I
        </ToolbarButton>
        <ToolbarButton action={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")}>
          P
        </ToolbarButton>
        {[1, 2, 3].map((lvl) => (
          <ToolbarButton
            key={lvl}
            action={() => editor.chain().focus().toggleHeading({ level: lvl as 1 | 2 | 3 }).run()}
            active={editor.isActive("heading", { level: lvl })}
          >
            H{lvl}
          </ToolbarButton>
        ))}
        <ToolbarButton action={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
          • List
        </ToolbarButton>
        <ToolbarButton action={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
          1. List
        </ToolbarButton>
        <ToolbarButton action={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
          “
        </ToolbarButton>
        <ToolbarButton action={setLink} active={editor.isActive("link")}>
          Link
        </ToolbarButton>
        <ToolbarButton action={addImage}>Bild</ToolbarButton>
        <ToolbarButton action={addVideo}>Video</ToolbarButton>
        <ToolbarButton action={() => editor.chain().focus().setHorizontalRule().run()}>HR</ToolbarButton>
      </div>
      <div className="min-h-[260px] rounded-lg border border-slate-200 bg-white p-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  action,
  active,
  children,
}: {
  action: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={action}
      className={`rounded-md px-2 py-1 text-xs font-semibold border border-slate-200 ${
        active ? "bg-[#ff1f8f] text-white border-[#ff1f8f]" : "bg-white text-slate-800 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function safeParse(value: string) {
  if (!value) return { type: "doc", content: [{ type: "paragraph" }] };
  try {
    const json = JSON.parse(value);
    if (json && json.type === "doc") return json;
    return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: value }] }] };
  } catch {
    return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: value }] }] };
  }
}
