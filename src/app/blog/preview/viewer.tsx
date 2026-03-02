"use client";

import dynamic from "next/dynamic";

const BlockNoteViewer = dynamic(() => import("@/components/BlockNoteViewer.client"), { ssr: false });

export default function ClientBlockNote({ json }: { json: string }) {
  return <BlockNoteViewer json={json} />;
}
