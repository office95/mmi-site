import { BlogEditor } from "../Editor";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const dynamicParams = true;

type Params = { params: { id: string } };

export default async function AdminBlogEditPage({ params }: Params) {
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase.from("posts").select("*").eq("id", params.id).maybeSingle();

  const initialPost = data
    ? {
        ...data,
        tags: data.tags ?? [],
        content: normalizeContent(data.content),
      }
    : undefined;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Admin</p>
          <h1 className="font-anton text-3xl">Blogbeitrag bearbeiten</h1>
        </div>
        <BlogEditor postId={params.id} initialPost={initialPost} />
      </div>
    </div>
  );
}

function normalizeContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  try {
    return JSON.stringify(content);
  } catch {
    return "";
  }
}
