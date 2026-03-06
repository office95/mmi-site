"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Script from "next/script";
import ConsultBanner from "@/components/ConsultBanner";
import { CountdownBadge } from "@/components/CountdownBadge";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getRegionFromCookie } from "@/lib/region-client";

const FALLBACK_PARTNERS = [
  {
    id: "1dda01f7-5404-4e00-800c-1ccc4a348f81",
    name: "Strelle Ton & Filmstudio",
    slug: "strelle-ton-filmstudio",
    state: "Kärnten",
    city: "Viktring",
    hero1_path: "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/bfe42457-274b-4228-bbf6-06f5af40b1cb.webp",
    tags: ["DJ Kurse", "Music Producer", "Musik Produktion", "Live-Tontechnik", "Tontechnik"],
    genres: ["DJ Kurse", "Music Producer", "Musik Produktion", "Live-Tontechnik", "Tontechnik"],
  },
  {
    id: "fallback-stella",
    name: "Stella Musica",
    slug: "stella-musica",
    state: "",
    city: "",
    hero1_path: "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/4a53d49b-c4a8-45c8-b3e5-25f4ba7128de.webp",
    tags: ["Schlager", "Pop", "Music Producer", "Musik Produktion"],
    genres: ["Schlager", "Pop", "Music Producer", "Musik Produktion"],
  },
];

export default function PartnerPage() {
  const params = useParams();
  const slugParamRaw = params?.slug;
  const slug = Array.isArray(slugParamRaw)
    ? decodeURIComponent(slugParamRaw.join("/"))
    : decodeURIComponent((slugParamRaw as string) ?? "");

  const supabase = getSupabaseBrowserClient();
  const [partner, setPartner] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [partnerBadges, setPartnerBadges] = useState<any[]>([]);
  const [courseBadges, setCourseBadges] = useState<Record<string, any[]>>({});
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const heroProgress = 1;
  const cardsProgress = 1;

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      const region = (getRegionFromCookie() as "AT" | "DE") || "AT";
      const regionFilter = `region.eq.${region},region.eq.${region.toLowerCase?.()},region.is.null,region.eq.`;
      let p1: any = null;
      try {
        const res1 = await supabase
          .from("partners")
          .select("id,name,slug,state,city,zip,street,website,hero1_path,hero1_mobile_path,tags,genre,genres,references_list,instructor_profiles,gallery_paths,promo_path,promo_mobile_path,slogan,region")
          .or(regionFilter)
          .eq("slug", slug)
          .maybeSingle();
        p1 = res1.data ?? null;
        if (!p1) {
            const res2 = await supabase
              .from("partners_public")
              .select("id,name,slug,state,city,zip,street,website,hero1_path,hero1_mobile_path,tags,genre,genres,references_list,instructor_profiles,gallery_paths,promo_path,promo_mobile_path,slogan,region")
              .or(regionFilter)
              .eq("slug", slug)
              .maybeSingle();
          p1 = res2.data ?? null;
        }
      } catch (_) {
        // ignore fetch errors
      }

      if (!p1) {
        p1 = FALLBACK_PARTNERS.find((p) => p.slug === slug) ?? null;
      }

      setPartner(p1);

      if (p1?.id) {
        let sessionsFetched: any[] = [];
        try {
          const { data: ses } = await supabase
            .from("sessions")
            .select(
              "id,start_date,start_time,price_cents,deposit_cents,seats_taken,max_participants,region,course:course_id(id,title,slug,hero_image_url,duration_hours,created_at,region)"
            )
            .eq("partner_id", p1.id)
            .or(regionFilter)
            .order("start_date", { ascending: true });
          sessionsFetched = ses ?? [];
          setSessions(sessionsFetched);
        } catch (_) {
          setSessions([]);
        }
        // Partner-Badges
        try {
          const { data: pb } = await supabase
            .from("partner_badges")
            .select("badge:badges(name,color,slug)")
            .eq("partner_id", p1.id);
          setPartnerBadges(
            (pb ?? [])
              .map((x: any) => x.badge)
              .filter(Boolean)
          );
        } catch (_) {
          setPartnerBadges([]);
        }

        // Course-Badges
        try {
          const courseIds = sessionsFetched.map((s: any) => s.course?.id).filter(Boolean);
          if (courseIds.length) {
            const { data: cb } = await supabase
              .from("course_badges")
              .select("course_id,badge:badges(name,color,slug)")
              .in("course_id", courseIds);
            const map: Record<string, any[]> = {};
            (cb ?? []).forEach((row: any) => {
              if (!row.course_id || !row.badge) return;
              if (!map[row.course_id]) map[row.course_id] = [];
              map[row.course_id].push(row.badge);
            });
            setCourseBadges(map);
          } else {
            setCourseBadges({});
          }
        } catch (_) {
          setCourseBadges({});
        }
        // Dozenten aus partner.instructor_profiles falls vorhanden
        setInstructors(Array.isArray(p1.instructor_profiles) ? p1.instructor_profiles : []);
        // Alle Badges (für auto-Regeln)
        try {
          const { data: all } = await supabase.from("badges").select("id,name,slug,scope,color,auto_type,created_at");
          setAllBadges(all ?? []);
        } catch (_) {
          setAllBadges([]);
        }
      } else {
        setSessions([]);
        setInstructors([]);
      }

      setLoading(false);
    };
    load();
  }, [slug, supabase]);

  const tags: string[] = Array.isArray(partner?.tags)
    ? partner.tags
    : typeof partner?.tags === "string"
      ? safeJsonArray(partner.tags)
      : [];
  const genres: string[] = Array.isArray(partner?.genre)
    ? partner.genre
    : Array.isArray(partner?.genres)
      ? partner.genres
      : typeof partner?.genre === "string"
        ? [partner.genre]
        : Array.isArray(partner?.genres)
          ? partner.genres
          : [];
  const references: string[] = Array.isArray(partner?.references_list)
    ? partner.references_list
    : typeof partner?.references_list === "string"
      ? safeJsonArray(partner.references_list)
      : [];
  const galleryPaths: string[] = Array.isArray(partner?.gallery_paths)
    ? partner.gallery_paths
    : typeof partner?.gallery_paths === "string"
      ? safeJsonArray(partner.gallery_paths)
      : [];

  const heroDesktop = partner?.hero1_path || "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1600&q=80";
  const heroMobile = partner?.hero1_mobile_path || heroDesktop;

  const futureSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (sessions || []).filter((s) => {
      if (!s.start_date) return false;
      const d = new Date(s.start_date + "T00:00:00");
      // nur strikt zukünftige Termine anzeigen (Starttag ausgeblendet)
      return d > today;
    });
  }, [sessions]);

  // Auto-Badges anwenden
  const appliedPartnerBadges = useMemo(() => {
    const list = [...partnerBadges];
    const auto = (allBadges || []).filter((b) => (b.scope === "partner" || b.scope === "both") && b.auto_type);
    // Fallback „Neu“ ohne DB-Badge: wenn innerhalb 21 Tage erstellt
    if (partner?.created_at) {
      const diff = (Date.now() - new Date(partner.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 21 && !list.find((x) => x.slug === "neu-auto")) {
        list.push({ name: "Neu", color: "#ff1f8f", slug: "neu-auto" });
      }
    }
    auto.forEach((b) => {
      const rule = b.auto_type as string;
      if (rule.startsWith("age:")) {
        const days = parseInt(rule.replace("age:", "").replace("d", ""), 10) || 0;
        if (partner?.created_at) {
          const created = new Date(partner.created_at);
          const now = new Date();
          const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          if (diff <= days && !list.find((x) => x.slug === b.slug)) list.push(b);
        }
      }
      if (rule === "metric:hot" && !list.find((x) => x.slug === b.slug)) {
        // Platzhalter: Falls später KPI vorliegt, hier hinzufügen
      }
    });
    return list;
  }, [partner, partnerBadges, allBadges]);

  const appliedCourseBadges = useMemo(() => {
    const result: Record<string, any[]> = { ...courseBadges };
    const auto = (allBadges || []).filter((b) => (b.scope === "course" || b.scope === "both") && b.auto_type);

    futureSessions.forEach((s) => {
      const cid = s.course?.id;
      if (!cid) return;
      const list = [...(result[cid] ?? [])];
      if (s.course?.created_at) {
        const diff = (Date.now() - new Date(s.course.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (diff <= 21 && !list.find((x) => x.slug === "neu-auto")) {
          list.push({ name: "Neu", color: "#ff1f8f", slug: "neu-auto" });
        }
      }

      auto.forEach((b) => {
        const rule = b.auto_type as string;
        if (rule.startsWith("age:")) {
          const days = parseInt(rule.replace("age:", "").replace("d", ""), 10) || 0;
          if (s.course?.created_at) {
            const created = new Date(s.course.created_at);
            const now = new Date();
            const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            if (diff <= days && !list.find((x) => x.slug === b.slug)) list.push(b);
          }
        }
        if (rule === "type:intensiv" && s.course?.type === "intensiv" && !list.find((x) => x.slug === b.slug)) {
          list.push(b);
        }
        if (rule === "type:extrem" && s.course?.type === "extrem" && !list.find((x) => x.slug === b.slug)) {
          list.push({ ...b, color: "#f97316" });
        }
        if (rule.startsWith("seats:<=")) {
          const max = s.max_participants ?? 0;
          const taken = s.seats_taken ?? 0;
          const free = max ? max - taken : 0;
          const threshold = parseInt(rule.replace("seats:<=", ""), 10) || 0;
          if (threshold && free <= threshold && free >= 0 && !list.find((x) => x.slug === b.slug)) {
            list.push(b);
          }
        }
      });

      result[cid] = list;
    });

    return result;
  }, [futureSessions, courseBadges, allBadges]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <SiteHeader />
      {partner?.name && (
        <Script
          id="partner-breadcrumb"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Startseite", item: process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at" },
                { "@type": "ListItem", position: 2, name: "Partner", item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at"}/kursstandorte` },
                { "@type": "ListItem", position: 3, name: partner.name, item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at"}/partner/${partner.slug}` },
              ],
            }),
          }}
        />
      )}
      <main className="flex-1">
        <section className="relative h-[75vh] w-full overflow-hidden bg-black">
          <picture>
            <source media="(max-width: 768px)" srcSet={heroMobile as string} />
            <Image src={heroDesktop} alt={partner?.name || slug || "Partner"} fill className="object-cover" priority />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/35" />
          <div className="absolute left-6 sm:left-12 top-[20%] text-left space-y-3">
            <p className="text-sm uppercase tracking-[0.22em] text-white/70">Partner</p>
            <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl text-white leading-tight drop-shadow-lg">
              {loading ? "Lade..." : partner?.name || `Kein Treffer für "${slug || "(leer)"}`}
            </h1>
            {!loading && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((t: string, idx: number) => (
                  <span key={idx} className="rounded-full bg-pink-500 px-3 py-1 text-xs font-semibold text-white">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <p className="text-white/85 text-lg font-semibold pt-1">
              {loading ? "" : partner?.state || partner?.city || "Bundesland folgt"}
            </p>
            {appliedPartnerBadges.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {appliedPartnerBadges.map((b, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow"
                    style={{ backgroundColor: b.color ?? "#0f172a" }}
                  >
                    {b.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <ScrollReveal>
                <div>
                  <h2 className="font-anton text-3xl text-slate-900">Aktuelle Kurse</h2>
                  <p className="text-slate-700 leading-relaxed">
                    Entdecke die aktuellen Kurse, die unser Partner anbietet. Wähle einen Termin und buche direkt.
                  </p>
                </div>
              </ScrollReveal>

              {futureSessions.length === 0 ? (
                <p className="text-slate-600">Keine kommenden Kurse gefunden.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {futureSessions.map((s, idx) => (
                    <ScrollReveal key={s.id} delay={idx * 80}>
                      <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition">
                        <div className="relative h-40 w-full bg-slate-100">
                          {s.course?.hero_image_url ? (
                            <Image
                              src={s.course.hero_image_url}
                              alt={s.course.title}
                              fill
                              className="object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-400 text-sm">Kein Bild</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                          {(appliedCourseBadges[s.course?.id ?? ""] ?? []).length > 0 && (
                            <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                              {(appliedCourseBadges[s.course?.id ?? ""] ?? []).slice(0, 3).map((b: any, j: number) => (
                                <span
                                  key={j}
                                  className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow"
                                  style={{ backgroundColor: b.color ?? "#0f172a" }}
                                >
                                  {b.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="absolute left-2 bottom-2">
                            <CountdownBadge startDate={s.start_date} startTime={s.start_time} />
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          <p className="text-xs uppercase tracking-[0.12em] text-pink-600">
                            {s.start_date
                              ? `Start · ${new Date(s.start_date + "T00:00:00").toLocaleDateString("de-AT")} ${
                                  s.start_time?.slice(0, 5) ? " | " + s.start_time.slice(0, 5) + " Uhr" : ""
                                }`
                              : "Start · Termin folgt"}
                          </p>
                          <h3 className="font-anton text-xl text-slate-900">{s.course?.title || "Kurs"}</h3>
                          {typeof s.course?.duration_hours === "number" && (
                            <p className="text-sm text-slate-600">Dauer: {s.course.duration_hours} Stunden</p>
                          )}
                          <p className="text-base font-semibold text-slate-900">
                            {typeof s.price_cents === "number" ? `${(s.price_cents / 100).toFixed(2)} €` : "Preis folgt"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {s.course?.slug && (
                              <>
                                <Link
                                  href={`/kurs/${s.course.slug}`}
                                  className="inline-flex w-fit rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                  aria-label={`Mehr Infos zu ${s.course.title}`}
                                >
                                  Mehr Infos
                                </Link>
                                <Link
                                  href={`/buchen/${s.id}?course=${s.course.slug}`}
                                  className="inline-flex w-fit rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 !text-white"
                                  aria-label={`Kurs ${s.course.title} buchen`}
                                >
                                  Buchen
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm uppercase tracking-[0.16em] text-slate-500">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {genres.length === 0 ? (
                  <span className="text-slate-500 text-sm">Keine Genres hinterlegt.</span>
                ) : (
                  genres.map((t, idx) => (
                    <span key={idx} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                      {t}
                    </span>
                  ))
                )}
              </div>

              <div className="h-4" />
              <h3 className="text-sm uppercase tracking-[0.16em] text-slate-500">Referenzen</h3>
              <div className="flex flex-wrap gap-2">
                {references.length === 0 ? (
                  <span className="text-slate-500 text-sm">Keine Referenzen hinterlegt.</span>
                ) : (
                  references.map((t, idx) => (
                    <span key={idx} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                      {t}
                    </span>
                  ))
                )}
              </div>

              <div className="mt-8 space-y-1 text-sm text-slate-800">
                {(partner?.street || partner?.zip || partner?.city || partner?.state) && (
                  <>
                    <p className="text-sm uppercase tracking-[0.16em] text-slate-500 mb-1">Kursstandort</p>
                    {partner?.street && <div className="text-slate-800">{partner.street}</div>}
                    {(partner?.zip || partner?.city) && (
                      <div className="text-slate-800">
                        {partner?.zip ? `${partner.zip}` : ""}{partner?.zip && partner?.city ? " " : ""}{partner?.city ?? ""}
                      </div>
                    )}
                    {partner?.state && <div className="text-slate-800">{partner.state}</div>}
                    <div className="h-2" />
                  </>
                )}
                {partner?.website && (
                  <div className="underline underline-offset-2 text-pink-600">
                    <a href={partner.website} target="_blank" rel="noreferrer">
                      {partner.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-100 relative z-10">
          <div className="mx-auto max-w-6xl px-6 pb-16 pt-12">
            <ScrollReveal>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Dozenten</p>
                  <h2 className="font-anton text-3xl text-slate-900">Dein Trainer-Team</h2>
                </div>
              </div>
            </ScrollReveal>
            {(!instructors || instructors.length === 0) ? (
              <p className="text-slate-600">Noch keine Dozenten hinterlegt.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {instructors.map((d: any, idx: number) => (
                  <div
                    key={d.id}
                    className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition"
                  >
                    <div className="relative w-full bg-slate-100 aspect-[4/3] overflow-hidden">
                      {d.image ? (
                        <Image
                          src={d.image}
                          alt={d.name ? `Dozent ${d.name}` : "Dozent"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 text-sm">Kein Bild</div>
                      )}
                    </div>
                    <div className="p-4 space-y-1">
                      <p className="font-anton text-xl text-slate-900">{d.name || "Dozent"}</p>
                      <p className="text-sm text-slate-600">{d.role || "Funktion folgt"}</p>
                      {Array.isArray(d.references) && d.references.length > 0 && (
                        <div className="pt-3 space-y-2">
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Referenzen</p>
                          <div className="flex flex-wrap gap-2">
                            {d.references.map((r: string, idx: number) => (
                              <span key={idx} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Abschnitt 4: Galerie / Promo-Video (sticky, mobile/desktop Quellen) */}
        <section className="relative h-[100vh] w-full overflow-hidden bg-black sticky top-0">
          {(() => {
            const mediaSource = (typeof window !== "undefined" && window.innerWidth <= 768 ? partner?.promo_mobile_path : null) || partner?.promo_path || galleryPaths[0];
            if (!mediaSource) {
              return <div className="flex h-full items-center justify-center text-slate-300 text-sm">Kein Galerie-Element hinterlegt.</div>;
            }

            const media = mediaSource;
            const isMp4 = /\.mp4($|\\?)/i.test(media);
            const isVimeo = media.includes("vimeo.com");

            if (isVimeo) {
              const idMatch = media.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
              const vid = idMatch ? idMatch[1] : "";
              const embedUrl = vid ? `https://player.vimeo.com/video/${vid}?background=1&autoplay=1&loop=1&muted=1&controls=0` : media;
              return (
                <iframe
                  src={embedUrl}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none"
                  style={{
                    width: "100vw",
                    height: "56.25vw",
                    minWidth: "177.78vh",
                    minHeight: "100vh",
                    pointerEvents: "none",
                  }}
                />
              );
            }

            if (isMp4) {
              return (
                <video
                  src={media}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover scale-[1.08]"
                />
              );
            }

            return <img src={media} alt="Galerie" className="absolute inset-0 h-full w-full object-cover scale-[1.08]" />;
          })()}
          {/* Overlay & Slogan */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <ScrollReveal delay={150}>
              <div className="mx-auto max-w-[1600px] space-y-2">
                {(partner?.slogan && partner.slogan.trim().length > 0 ? partner.slogan : "Music Mission. Lerne von den besten. Für Anfänger und Fortgeschrittene")
                  .split(".")
                  .map((line: string) => line.trim())
                  .filter(Boolean)
                  .map((line: string, idx: number) => (
                    <span
                      key={idx}
                      className={`block font-anton text-white drop-shadow-[0_18px_36px_rgba(0,0,0,0.75)] ${
                        idx === 0
                          ? "text-[clamp(64px,8vw,90px)]"
                          : idx === 1
                            ? "text-[clamp(48px,6vw,72px)]"
                            : "text-[clamp(32px,5vw,56px)] text-white/90"
                      } leading-[0.9] tracking-[-0.02em]`}
                    >
                      {line}.
                    </span>
                  ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Beratung CTA vor Footer */}
        <section className="relative bg-white">
          <ConsultBanner height="80vh" overlapOffset="0" zIndex="z-30" />
        </section>

      </main>
    </div>
  );
}

function safeJsonArray(str: string | null | undefined): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Einfacher Scroll-Reveal (Apple-like Fade/Up) für Texte
function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
