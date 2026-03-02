import { getSupabaseServerClient } from "@/lib/supabase";
import { AdminHeroManager } from "@/components/admin/AdminHeroManager";

export const revalidate = 0; // always fresh in admin

export default async function AdminHeroPage() {
  const supabase = getSupabaseServerClient();
  const { data: slides } = await supabase
    .from("hero_slides")
    .select("id,title,subtitle,image_url,position,is_active,created_at")
    .order("position", { ascending: true });
  const safeSlides = slides ?? [];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Admin</p>
            <h1 className="text-3xl font-bold">Hero Slides</h1>
            <p className="text-sm text-slate-600">Bilder hochladen, Reihenfolge ändern, Slides löschen.</p>
          </div>
        </div>
        <AdminHeroManager initialSlides={safeSlides} />
      </div>
    </div>
  );
}
