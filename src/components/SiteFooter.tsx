import { getSupabaseServiceClient } from "@/lib/supabase";

const toUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/${path.replace(/^\/+/, "")}`;
};

export default async function SiteFooter() {
  const supabase = getSupabaseServiceClient();
  let logo = "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/db3152ef-7e1f-4a78-bb88-7528a892fdc4.webp";
  const { data } = await supabase.from("settings").select("value").eq("key", "site_logo_url").maybeSingle();
  if (data?.value) {
    logo = toUrl(data.value) ?? logo;
  }

  return (
    <footer
      className="relative bg-[#ff1f8f] text-white px-6 sm:px-10 lg:px-20 z-40 pb-0 shadow-[0_-16px_48px_rgba(0,0,0,0.14)] h-[30vh] min-h-[30vh] max-h-[30vh]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 sm:h-24 bg-gradient-to-t from-[#ff1f8f] to-transparent" />
      <div className="mx-auto max-w-[1200px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-10 pb-6 relative z-10">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="Music Mission Institute Logo" className="h-14 w-auto" />
          <div>
            <p className="font-semibold text-base">Music Mission Institute</p>
            <p className="text-sm text-white/80">Kurse in Musikproduktion, Tontechnik & Live-Engineering</p>
          </div>
        </div>
        <div className="text-sm text-white space-y-2">
          <div className="flex gap-4">
            <a href="#" className="underline underline-offset-4 hover:text-black">Datenschutz</a>
            <a href="#" className="underline underline-offset-4 hover:text-black">AGB</a>
            <a href="/impressum" className="underline underline-offset-4 hover:text-black">Impressum</a>
          </div>
          <p className="text-white/80 text-xs">© {new Date().getFullYear()} Music Mission Institute</p>
        </div>
      </div>
    </footer>
  );
}
