import { BlogEditor } from "../Editor";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default function AdminBlogNewPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Admin</p>
          <h1 className="font-anton text-3xl">Neuer Blogbeitrag</h1>
        </div>
        <BlogEditor />
      </div>
    </div>
  );
}
