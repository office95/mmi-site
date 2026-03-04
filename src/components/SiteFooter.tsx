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
    <footer className="relative bg-[#ff1f8f] text-white px-5 sm:px-10 lg:px-20 z-40 shadow-[0_-16px_48px_rgba(0,0,0,0.14)] pt-10 pb-10 sm:pt-12 sm:pb-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-14 sm:h-20 bg-gradient-to-t from-[#ff1f8f] to-transparent" />
      <div className="mx-auto max-w-[1200px] relative z-10">
        {/* Mobile Layout */}
        <div className="flex flex-col gap-4 sm:hidden">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="Music Mission Institute Logo" className="h-12 w-auto" />
            <div className="text-left">
              <p className="font-semibold text-base leading-tight">Music Mission Institute</p>
              <p className="text-xs text-white/80">Kurse in Musikproduktion, Tontechnik & Live-Engineering</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm font-semibold text-white/90">
            <a href="#" className="underline underline-offset-4 hover:text-black">Datenschutz</a>
            <span className="text-white/60">•</span>
            <a href="#" className="underline underline-offset-4 hover:text-black">AGB</a>
            <span className="text-white/60">•</span>
            <a href="/impressum" className="underline underline-offset-4 hover:text-black">Impressum</a>
          </div>
          <p className="text-white/80 text-xs text-center">© {new Date().getFullYear()} Music Mission Institute</p>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt="Music Mission Institute Logo" className="h-16 w-auto sm:h-20" />
              <div className="text-left">
                <p className="font-semibold text-lg sm:text-xl leading-tight">Music Mission Institute</p>
                <p className="text-sm sm:text-base text-white/80">Kurse in Musikproduktion, Tontechnik & Live-Engineering</p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end text-sm text-white space-y-2">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-end sm:items-center text-center sm:text-right">
                <a href="#" className="underline underline-offset-4 hover:text-black">Datenschutz</a>
                <a href="#" className="underline underline-offset-4 hover:text-black">AGB</a>
                <a href="/impressum" className="underline underline-offset-4 hover:text-black">Impressum</a>
              </div>
              <p className="text-white/80 text-xs sm:text-sm">© {new Date().getFullYear()} Music Mission Institute</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
