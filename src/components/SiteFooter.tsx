import { getSupabaseServiceClient } from "@/lib/supabase";
import Image from "next/image";
import { headers } from "next/headers";

const toUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/${path.replace(/^\/+/, "")}`;
};

export default async function SiteFooter() {
  const supabase = getSupabaseServiceClient();
  const host = headers().get("host")?.toLowerCase() ?? "";
  const disableLegalLinks = host.includes("musicmission.de") || host.endsWith(".de");
  let logo = "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/db3152ef-7e1f-4a78-bb88-7528a892fdc4.webp";
  const { data: settings } = await supabase.from("settings").select("key,value").in("key", ["site_logo_url", "pdf_agb_url", "pdf_datenschutz_url"]);
  const logoRow = settings?.find((s: any) => s.key === "site_logo_url");
  const agbRow = settings?.find((s: any) => s.key === "pdf_agb_url");
  const dsRow = settings?.find((s: any) => s.key === "pdf_datenschutz_url");
  if (logoRow?.value) logo = toUrl(logoRow.value) ?? logo;
  const agbUrl = disableLegalLinks ? "" : toUrl(agbRow?.value ?? null) || "";
  const dsUrl = disableLegalLinks ? "" : toUrl(dsRow?.value ?? null) || "";

  return (
    <footer className="relative bg-[#ff1f8f] text-white px-5 sm:px-10 lg:px-20 z-40 shadow-[0_-16px_48px_rgba(0,0,0,0.14)] pt-10 pb-10 sm:pt-12 sm:pb-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-14 sm:h-20 bg-gradient-to-t from-[#ff1f8f] to-transparent" />
      <div className="mx-auto max-w-[1200px] relative z-10">
        {/* Mobile Layout */}
        <div className="flex flex-col gap-4 sm:hidden">
          <div className="flex items-center gap-3">
            <Image src={logo} alt="Music Mission Institute Logo" className="h-12 w-auto" width={120} height={48} priority />
            <div className="text-left">
              <p className="font-semibold text-base leading-tight">Music Mission Institute</p>
              <p className="text-xs text-white/80">Kurse in Musikproduktion, Tontechnik & Live-Engineering</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm font-semibold text-white/90">
            {dsUrl && (
              <>
                <a href={dsUrl} className="underline underline-offset-4 hover:text-black" target="_blank" rel="noreferrer">Datenschutz</a>
                <span className="text-white/60">•</span>
              </>
            )}
            {agbUrl && (
              <>
                <a href={agbUrl} className="underline underline-offset-4 hover:text-black" target="_blank" rel="noreferrer">AGB</a>
                <span className="text-white/60">•</span>
              </>
            )}
            <a href="/partner-werden" className="underline underline-offset-4 hover:text-black">Partner werden</a>
            <span className="text-white/60">•</span>
            <a href="/impressum" className="underline underline-offset-4 hover:text-black">Impressum</a>
          </div>
          <p className="text-white/80 text-xs text-center">© {new Date().getFullYear()} Music Mission Institute</p>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-4 sm:gap-5">
                <Image src={logo} alt="Music Mission Institute Logo" className="h-16 w-auto sm:h-20" width={180} height={90} />
                <div className="text-left">
                  <p className="font-semibold text-lg sm:text-xl leading-tight">Music Mission Institute</p>
                  <p className="text-sm sm:text-base text-white/80">Kurse in Musikproduktion, Tontechnik & Live-Engineering</p>
                </div>
              </div>
              <div className="flex flex-col sm:items-end text-sm text-white space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center text-center sm:text-right">
                  {[
                    { label: "Partner werden", href: "/partner-werden" },
                    { label: "Über uns", href: "/ueber-uns" },
                    agbUrl ? { label: "AGB", href: agbUrl, external: true } : null,
                    dsUrl ? { label: "Datenschutz", href: dsUrl, external: true } : null,
                    { label: "Impressum", href: "/impressum" },
                  ]
                    .filter(Boolean)
                    .map((item: any, idx, arr) => (
                      <span key={item.label} className="flex items-center sm:ml-4 sm:first:ml-0">
                        <a
                          href={item.href}
                          target={item.external ? "_blank" : undefined}
                          rel={item.external ? "noreferrer" : undefined}
                          className="underline underline-offset-4 transition text-white/90 hover:text-black"
                        >
                          {item.label}
                        </a>
                        {idx < arr.length - 1 && <span className="mx-2 text-white/60 hidden sm:inline">•</span>}
                      </span>
                    ))}
                </div>
                <p className="text-white/80 text-xs sm:text-sm">© {new Date().getFullYear()} Music Mission Institute</p>
              </div>
            </div>
          </div>
        </div>
    </footer>
  );
}
