"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Partner = {
  name?: string;
  slug?: string | null;
  state?: string | null;
  city?: string | null;
  logo_path?: string | null;
  country?: string | null;
  region?: string | null;
};

type Props = {
  partners: Partner[];
  fallbackLogos: { src: string; alt: string }[];
};

const toUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/${path.replace(/^\/+/, "")}`;
};

export function PartnerMarqueeClient({ partners, fallbackLogos }: Props) {
  const [region, setRegion] = useState<"DE" | "AT">("AT");
  const [host, setHost] = useState<string>("");

  useEffect(() => {
    const h = typeof window !== "undefined" ? window.location.host.toLowerCase() : "";
    setHost(h || "(leer)");
    const r = h.includes("musicmission.de") || h.endsWith(".de") ? "DE" : h.includes("musicmission.at") || h.endsWith(".at") ? "AT" : "AT";
    setRegion(r);
  }, []);

  const list = useMemo(() => {
    const filtered = partners.filter((p) => {
      const pr = (p.region || "").toString().trim().toUpperCase();
      const c = (p.country || "").toUpperCase();
      const matchRegion = pr ? pr === region : false;
      const matchCountry = c ? c === region : false;
      const noRegion = !pr && !c;
      return matchRegion || matchCountry || noRegion;
    });
    return filtered.length ? filtered : fallbackLogos;
  }, [partners, region, fallbackLogos]);

  return (
    <>
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Partner</p>
        <h2 className="font-anton text-4xl sm:text-5xl leading-[1.05] text-slate-900">
          {region === "DE" ? "Unsere Partner in Deutschland" : "Unsere Partner in Österreich"}
        </h2>
        <p className="text-xs text-slate-500">Debug Region: {region} · host: {host}</p>
      </div>
      <div className="relative overflow-x-auto overflow-y-hidden py-4">
        <div className="marquee" style={{ maxWidth: "1600px", margin: "0 auto" }}>
          <div className="marquee-track animate-marquee-fast min-w-max">
            {list.map((p, idx) => {
              const name = (p as any).name || (p as any).alt;
              const state = (p as any).state;
              const logo = (p as any).logo_path ? toUrl((p as any).logo_path) : (p as any).src;
              const slug = (p as any).slug;
              return (
                <a
                  key={idx}
                  href={slug ? `/partner/${slug}` : "#"}
                  className="group mx-6 flex flex-col items-center gap-3 min-w-[25vh]"
                  style={{ width: "25vh" }}
                >
                  <div className="relative h-[25vh] w-[25vh] overflow-hidden flex items-center justify-center rounded-3xl">
                    {state ? (
                      <span className="absolute right-2 top-2 z-20 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 shadow-sm">
                        {state}
                      </span>
                    ) : null}
                    {logo ? (
                      <Image
                        src={logo}
                        alt={name ?? "Partner Logo"}
                        fill
                        className="object-contain opacity-90 group-hover:opacity-100 transition duration-500"
                        sizes="25vh"
                      />
                    ) : (
                      <span className="text-white/70 text-lg">{name ?? "Partner"}</span>
                    )}
                  </div>
                  <span className="text-base font-semibold text-slate-900 text-center whitespace-nowrap">{name ?? "Partner"}</span>
                  {state ? <span className="text-[12px] uppercase tracking-[0.12em] text-slate-600">{state}</span> : null}
                </a>
              );
            })}
            {list.map((p, idx) => {
              const name = (p as any).name || (p as any).alt;
              const state = (p as any).state;
              const logo = (p as any).logo_path ? toUrl((p as any).logo_path) : (p as any).src;
              const slug = (p as any).slug;
              return (
                <a
                  key={`dup-${idx}`}
                  href={slug ? `/partner/${slug}` : "#"}
                  className="group mx-6 flex flex-col items-center gap-3 min-w-[25vh]"
                  style={{ width: "25vh" }}
                >
                  <div className="relative h-[25vh] w-[25vh] overflow-hidden flex items-center justify-center rounded-3xl">
                    {state ? (
                      <span className="absolute right-2 top-2 z-20 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 shadow-sm">
                        {state}
                      </span>
                    ) : null}
                    {logo ? (
                      <Image
                        src={logo}
                        alt={name ?? "Partner Logo"}
                        fill
                        className="object-contain opacity-90 group-hover:opacity-100 transition duration-500"
                        sizes="25vh"
                      />
                    ) : (
                      <span className="text-white/70 text-lg">{name ?? "Partner"}</span>
                    )}
                  </div>
                  <span className="text-base font-semibold text-slate-900 text-center whitespace-nowrap">{name ?? "Partner"}</span>
                  {state ? <span className="text-[12px] uppercase tracking-[0.12em] text-slate-600">{state}</span> : null}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
