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
  const host = (await headers()).get("host")?.toLowerCase() ?? "";
  const disableLegalLinks = host.includes("musicmission.de") || host.endsWith(".de");
  let logo = "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/db3152ef-7e1f-4a78-bb88-7528a892fdc4.webp";
  const { data: settings } = await supabase.from("settings").select("key,value").in("key", ["site_logo_url", "pdf_agb_url", "pdf_datenschutz_url"]);
  const logoRow = settings?.find((s: any) => s.key === "site_logo_url");
  const agbRow = settings?.find((s: any) => s.key === "pdf_agb_url");
  const dsRow = settings?.find((s: any) => s.key === "pdf_datenschutz_url");
  if (logoRow?.value) logo = toUrl(logoRow.value) ?? logo;
  const agbUrl = disableLegalLinks ? "" : toUrl(agbRow?.value ?? null) || "";
  const dsUrl = disableLegalLinks ? "" : toUrl(dsRow?.value ?? null) || "";

  const socials = [
    { label: "Instagram", href: "https://instagram.com/music_mission_institute", icon: "instagram" },
    { label: "Facebook", href: "https://facebook.com/musicmissioninstitute4success?locale=de_DE", icon: "facebook" },
    { label: "TikTok", href: "https://tiktok.com/@music.mission.ins", icon: "tiktok" },
    { label: "YouTube", href: "https://www.youtube.com/@music_mission", icon: "youtube" },
  ];

  const renderIcon = (name: string) => {
    switch (name) {
      case "instagram":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" ry="5" />
            <circle cx="12" cy="12" r="3.6" />
            <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
          </svg>
        );
      case "facebook":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M13.2 10.5h2.2l.3-2.6h-2.5V6.6c0-.7.2-1.2 1.3-1.2H16V3.1C15.6 3 14.5 3 13.3 3 10.8 3 9.1 4.5 9.1 6.9v1H7v2.6h2.1V21h3.1z" />
          </svg>
        );
      case "tiktok":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12.5 4h2.7c0 1.7 1.3 3 3 3h.9v2.6c-1.1-.1-2.1-.4-3.1-.9v6.2a6.4 6.4 0 1 1-6.4-6.4c.3 0 .6 0 .9.1V11a3.7 3.7 0 1 0 2.7 3.5V4Z" />
          </svg>
        );
      case "youtube":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M21.5 8s-.2-1.4-.7-1.9c-.5-.6-1.1-.7-1.7-.8C16.7 5 12 5 12 5s-4.7 0-7.1.3c-.6.1-1.2.2-1.7.8-.5.5-.7 1.9-.7 1.9S2 9.6 2 11.2v1.6c0 1.6.2 3.2.2 3.2s.2 1.4.7 1.9c.5.6 1.1.7 1.7.8 2.4.3 7.1.3 7.1.3s4.7 0 7.1-.3c.6-.1 1.2-.2 1.7-.8.5-.5.7-1.9.7-1.9s.2-1.6.2-3.2v-1.6C21.7 9.6 21.5 8 21.5 8Zm-11 5.9V8.9l4.8 2.5-4.8 2.5Z" />
          </svg>
        );
      default:
        return null;
    }
  };

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
          <div className="flex justify-center gap-4 pt-1">
            {socials.map((s) => (
              <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
                {renderIcon(s.icon)}
              </a>
            ))}
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
                <div className="flex gap-3 sm:justify-end sm:w-full">
                  {socials.map((s) => (
                    <a
                      key={s.href}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
                    >
                      {renderIcon(s.icon)}
                    </a>
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
