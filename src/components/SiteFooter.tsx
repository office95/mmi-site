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
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
            <circle cx="12" cy="12" r="3.8" />
            <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
          </svg>
        );
      case "facebook":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.5 8.5V6.8c0-.9.6-1.3 1.2-1.3H16V3h-2.2C11.3 3 10 4.6 10 6.6v1.9H8v2.5h2V21h3v-8h2.1l.4-2.5h-2.5z" />
          </svg>
        );
      case "tiktok":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 7.8a5.2 5.2 0 0 1-3-1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1V7.1c-3 0-5.5 2.4-5.5 5.5S8.4 18 11.5 18a5.5 5.5 0 0 0 5.5-5.5V8.3c.9.6 2 1 3 1V7.8z" />
          </svg>
        );
      case "youtube":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.6 7.2s-.2-1.5-.8-2.1c-.7-.8-1.5-.8-1.9-.9-2.6-.2-6.5-.2-6.5-.2h-.1s-3.9 0-6.5.2c-.4 0-1.3.1-2 .9-.6.6-.8 2.1-.8 2.1S3 9 .9 11v2c0 .6.2 1.1.2 1.1s.2 1.5.8 2.1c.7.8 1.7.8 2.1.9 1.5.1 6.3.2 6.3.2s3.9 0 6.5-.2c.4 0 1.3-.1 2-.9.6-.6.8-2.1.8-2.1s.2-.5.2-1.1v-2c0-.6-.2-1.1-.2-1.1s-.2-1.5-.8-2.1zM9.8 14.7V9.3l4.9 2.7-4.9 2.7z" />
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
