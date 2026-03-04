/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import Image from "next/image";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase";
import { SiteHeader } from "@/components/SiteHeader";
import SessionCheckout from "@/components/SessionCheckout";
import Reveal from "@/components/Reveal";
import Parallax from "@/components/Parallax";
import ConsultBanner from "@/components/ConsultBanner";
import { headers } from "next/headers";
import { getRegion } from "@/lib/region";
import { CourseModulesAccordion } from "./CourseModulesAccordion";
import { FaqAccordion } from "./FaqAccordion";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const toUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/${path.replace(/^\/+/, "")}`;
};

const toHtml = (text: string | null | undefined) => {
  if (!text) return "";
  if (text.includes("<")) return text;

  const fmtInline = (chunk: string) =>
    chunk
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      .replace(/\*(?!\*)(.+?)\*(?!\*)/g, "<em>$1</em>")
      .replace(/_(?!_)(.+?)_(?!_)/g, "<em>$1</em>");

  const norm = text.replace(/\r?\n/g, "\n");
  const lines = norm.split("\n");
  if (lines.every((l) => l.trim().startsWith("- "))) {
    const items = lines.map((l) => `<li>${fmtInline(l.trim().replace(/^-\\s*/, ""))}</li>`).join("");
    return `<ul>${items}</ul>`;
  }
  return `<p>${fmtInline(lines.join("<br>"))}</p>`;
};

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Slug vor dem try/catch ermitteln – primär aus params, fallback auf searchParams.slug (zur Sicherheit bei fehlerhaften Links)
  const pickSlugEarly = () => {
    const raw = params?.slug ?? searchParams?.slug;
    if (Array.isArray(raw)) return raw[0];
    return typeof raw === "string" ? raw : "";
  };
  const slugCleanInitial = pickSlugEarly().trim();
  if (!slugCleanInitial) {
    // Ohne Slug ist diese Route ungültig -> 404
    return notFound();
  }

  let course: any = null;
  let region: "AT" | "DE" = getRegion(); // Default, wird im try ggf. überschrieben
  let supabase: ReturnType<typeof getSupabaseServerClient> | ReturnType<typeof getSupabaseServiceClient> | null = null;
  let slugClean = slugCleanInitial;
  let allowAllHosts = false;
  let lastError: any = null;
  let host = "";

  try {
    const safeTrim = (v: unknown) => (typeof v === "string" ? v.trim() : "");

    const hdr = await headers();
    const rawHost = (hdr.get("x-forwarded-host") || hdr.get("host") || "").toLowerCase();
    host = rawHost.replace(/^www\./, "").split(":")[0]; // strip www + port
    const isPreview = host.includes("vercel.app") || host.includes("localhost");
    allowAllHosts = isPreview;
    region = host.endsWith(".de") ? "DE" : host.endsWith(".at") ? "AT" : getRegion();

    supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseServiceClient() : getSupabaseServerClient();
    console.warn("[Kursseite] incoming", { params, searchParams, slugClean, host });
    const normalize = (s: string) => safeTrim(s).toLowerCase().replace(/\s+/g, "-");

    const uuidMatch = slugClean.match(/^[0-9a-fA-F-]{36}$/);
    if (uuidMatch) {
      const { data, error } = await supabase.from("courses").select("*").eq("id", slugClean).maybeSingle();
      if (error) lastError = error.message;
      if (data) course = data;
    }

    if (!course && slugClean) {
      const { data, error } = await supabase.from("courses").select("*").eq("slug", slugClean).maybeSingle();
      if (error) lastError = error.message;
      if (data) course = data;
    }

    if (!course) {
      const candidates = Array.from(
        new Set<string>([
          slugClean,
          slugClean.toLowerCase(),
          slugClean.replace(/_/g, "-"),
          slugClean.replace(/-/g, "_"),
          normalize(slugClean),
          normalize(slugClean).replace(/_/g, "-"),
        ]).values()
      ).filter(Boolean);

      const orFilter = candidates.map((c) => `slug.eq.${c}`).join(",");
      if (orFilter) {
        const { data, error } = await supabase.from("courses").select("*").or(orFilter);
        if (error) lastError = error.message;
        if (data && data.length > 0) {
          course =
            data.find((c: any) => safeTrim(c.slug) === slugClean) ||
            data.find((c: any) => normalize(c.slug ?? "") === normalize(slugClean)) ||
            data[0];
        }
      }
    }

    if (!course) {
      const { data: allCourses, error } = await supabase.from("courses").select("*");
      if (error) lastError = error.message;
      if (allCourses) {
        const target = normalize(slugClean);
        course =
          allCourses.find((c: any) => normalize(c.slug ?? "") === target || normalize(c.title ?? "") === target) ||
          allCourses.find((c: any) => normalize(c.slug ?? "").startsWith(target) || normalize(c.title ?? "").startsWith(target)) ||
          null;
      }
    }

    // Fallback: ilike-Search (case-insensitive) auf slug
    if (!course) {
      const { data: ilikeCourse, error } = await supabase
        .from("courses")
        .select("*")
        .ilike("slug", `%${slugClean}%`)
        .maybeSingle();
      if (error) lastError = error.message;
      if (ilikeCourse) course = ilikeCourse;
    }
  } catch (err) {
    console.error("CoursePage fatal error", err);
    lastError = err instanceof Error ? err.message : String(err);
  }

  const bookingFlag = typeof searchParams === "object" && searchParams
    ? (Array.isArray(searchParams.booking) ? searchParams.booking[0] : searchParams.booking) ?? null
    : null;

  // Region-Mismatch nicht blockieren (insb. Preview/Mehrsprach-Domains)

  if (!course) {
    console.warn("[Kursseite] Kurs nicht gefunden", { slug: slugClean, host, region, lastError });
    const supa = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseServiceClient() : getSupabaseServerClient();
    const activeClient = supa || getSupabaseServerClient();
    const { data: list } = await activeClient.from("courses").select("title, slug").limit(10);
    return (
      <div className="min-h-screen bg-white text-slate-900">
        <SiteHeader />
        <div className="px-6 py-20 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Kurs nicht gefunden</h1>
          <p className="text-slate-600 mt-2">Für den Slug „{slugClean || params.slug || "(leer)"}“ wurde kein Kurs gefunden.</p>
          {lastError && <p className="text-xs text-red-600">Fehler: {lastError}</p>}
          <p className="text-[11px] text-slate-500">Host: {host || "unbekannt"} · Region: {region || "?"}</p>
          {list && (
            <div className="mx-auto max-w-lg text-left text-sm text-slate-700">
              <p className="font-semibold mb-2">Vorhandene Slugs (Top 10):</p>
              <ul className="space-y-1">
                {list.map((c: any, i: number) => (
                  <li key={i} className="rounded border border-slate-200 px-3 py-1">
                    <span className="font-semibold">{c.title}</span>{" "}
                    <span className="text-xs text-slate-500">({c.slug})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  const regionFilter = `region.eq.${region},region.eq.${region.toLowerCase()},region.ilike.%${region}%,region.is.null,region.eq.,region.eq.%20`; // strikt, aber erlaubt leere/null -> global

  const db = supabase ?? getSupabaseServerClient();

  let { data: sessions } = await db
    .from("sessions")
    .select("*")
    .eq("course_id", course.id)
    .or(regionFilter);
  if (!sessions || sessions.length === 0) {
    const { data: altSessions } = await db
      .from("sessions")
      .select("*, courses!inner(slug)")
      .eq("courses.slug", course.slug)
      .or(regionFilter);
    sessions = altSessions ?? [];
  }

  const partnerIds = Array.from(new Set((sessions ?? []).map((s: any) => s.partner_id).filter(Boolean)));
  let partnerMap = new Map<string, any>();
  if (partnerIds.length) {
    const { data: partnerRows } = await db
      .from("partners")
      .select("*")
      .in("id", partnerIds as string[]);
    partnerMap = new Map((partnerRows ?? []).map((p: any) => [p.id, p]));
  }
  const sessionsWithPartner = (sessions ?? []).map((s: any) => ({
    ...s,
    partners: partnerMap.get(s.partner_id as string) || null,
  }));

  const { data: addons } = await db.from("addons").select("*").eq("course_id", course.id);
  // Region-basierte Session-Filter: auf AT-Seite keine DE-Sessions anzeigen (und umgekehrt)
  const allowedCountries =
    region === "DE" ? ["deutschland", "germany"] : region === "AT" ? ["österreich", "austria"] : null;
  course.sessions = sessionsWithPartner.filter((s: any) => {
    if (!allowedCountries) return true;
    const country = (s.country || s.partners?.country || "").toString().toLowerCase();
    if (!country) return true; // wenn nicht gesetzt, zulassen
    return allowedCountries.some((c) => country.includes(c));
  });
  course.addons = addons ?? [];

  let states: string[] = [];
  const sessionPartners = Array.from(new Set((course.sessions ?? []).map((s: any) => s.partner_id).filter(Boolean)));
  if (sessionPartners.length) {
    const { data: partnerRows } = await db
      .from("partners")
      .select("id,state,city,country")
      .in("id", sessionPartners as string[]);
    const partnerMap2 = new Map<string, any>((partnerRows ?? []).map((p: any) => [p.id, p]));
    const regionCountry = region === "DE" ? "deutschland" : region === "AT" ? "österreich" : "";
    states = Array.from(
      new Set(
        (course.sessions ?? [])
          .map((s: any) => {
            const p = partnerMap2.get(s.partner_id as string);
            const country = (p?.country || s.country || "").toString().toLowerCase();
            const candidate =
              s.state ||
              p?.state ||
              p?.city ||
              country ||
              "";
            // Nur Länder/Regionen anzeigen, die zur aktuellen Region passen, damit kein „Deutschland“ auf der AT-Seite auftaucht (und umgekehrt).
            if (regionCountry && country && country !== regionCountry) return "";
            return candidate;
          })
          .filter(Boolean)
      )
    );
  }

  const { data: siteLogoSetting } = await db.from("settings").select("value").eq("key", "site_logo_url").maybeSingle();

  const heroDefault = "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1600&q=80";
  const heroDesktop = toUrl(course.hero_image_url) ?? heroDefault;
  const heroMobile = toUrl(course.hero_image_mobile_url) ?? heroDesktop;
  const sloganMediaDesktop = course.slogan_image_url ?? course.slogan_image_mobile_url ?? "";
  const sloganMediaMobile = course.slogan_image_mobile_url ?? course.slogan_image_url ?? "";
  const stateText = states.length ? states.join(" | ") : region === "DE" ? "Standort in Deutschland" : "Bundesland folgt";

  const footerLogo =
    toUrl(siteLogoSetting?.value ?? null) ??
    "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/db3152ef-7e1f-4a78-bb88-7528a892fdc4.webp";

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />

      <section className="relative h-[75vh] w-full overflow-hidden bg-black">
        <div className="absolute inset-0">
          <picture>
            <source media="(max-width: 768px)" srcSet={heroMobile as string} />
            <img
              src={heroDesktop as string}
              alt={course.title}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto object-cover"
            />
          </picture>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-transparent" />
        <div className="absolute left-6 sm:left-12 right-6 sm:right-12 top-[20%] text-left space-y-3 drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/80">
            <span className="h-2 w-2 rounded-full bg-[#ff1f8f]" /> Kurs
          </div>
          <h1
            className="font-anton leading-[0.95] text-white"
            style={{ fontSize: "clamp(56px, 8vw, 90px)" }}
          >
            {course.title}
          </h1>
          {Array.isArray(course.tags) && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {course.tags.map((t: string, idx: number) => (
                <span key={idx} className="rounded-full bg-[#ff1f8f] px-3 py-1 text-[11px] font-semibold text-white shadow-sm shadow-black/20">
                  {t}
                </span>
              ))}
            </div>
          )}
          <p
            className="font-semibold leading-tight text-white/90"
            style={{ fontSize: "clamp(22px, 3.2vw, 40px)" }}
          >
            {stateText}
          </p>
        </div>
      </section>

      <main className="px-4 py-10 sm:px-8 lg:px-20 bg-slate-50/40">
        <div className="mx-auto max-w-[1200px] grid gap-8 lg:gap-10 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div className="space-y-3">
              <h2 className="font-anton text-3xl sm:text-4xl lg:text-5xl text-slate-900 leading-tight">{course.title}</h2>
              {course.subtitle && (
                <div
                  className="prose mt-1 text-lg font-semibold max-w-none text-[#ff1f8f]"
                  dangerouslySetInnerHTML={{ __html: toHtml(course.subtitle) }}
                />
              )}
              {course.summary && (
                <div className="prose prose-slate mt-3 text-lg max-w-none" dangerouslySetInnerHTML={{ __html: toHtml(course.summary) }} />
              )}
            </div>

            {(!course.sessions || course.sessions.length === 0) && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Für diesen Kurs sind aktuell keine Termine hinterlegt.
              </div>
            )}

            {course.content && (
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Kursinhalt</h2>
                <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: toHtml(course.content) }} />
              </div>
            )}

            {course.audience && (
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Für wen?</h3>
                <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: toHtml(course.audience) }} />
              </div>
            )}

            {(course.key_facts ?? []).length > 0 && (
              <div className="space-y-4">
                {(course.modules ?? []).length > 0 && <CourseModulesAccordion modules={course.modules ?? []} />}
                <h3 className="text-2xl font-semibold text-slate-900">Das erwartet dich</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(course.key_facts ?? []).map((f: string, i: number) => (
                    <Reveal key={i} delay={i * 80}>
                      <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-600 transition group-hover:border-slate-400 group-hover:text-slate-800">
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          <p className="text-lg font-semibold text-slate-900 leading-relaxed tracking-tight group-hover:text-slate-950">
                            {f}
                          </p>
                        </div>
                        <div className="absolute inset-x-5 bottom-0 h-px bg-slate-200 group-hover:bg-slate-300" />
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            )}

            {(course.base_price_cents || course.duration_hours) && (
              <Reveal delay={120}>
                <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm space-y-3">
                  <h3 className="text-lg font-semibold text-slate-900">Investition</h3>
                  {course.base_price_cents && (
                    <p className="text-3xl font-bold text-[#ff1f8f]">
                      {(course.base_price_cents / 100).toFixed(2)} €
                    </p>
                  )}
                  {course.deposit_cents && (
                    <p className="text-sm text-slate-600">Anzahlung: {(course.deposit_cents / 100).toFixed(2)} €</p>
                  )}
                  {course.duration_hours && (
                    <p className="text-sm text-slate-700">Dauer: {course.duration_hours} Stunden</p>
                  )}
                  <p className="text-sm text-slate-700">Format: Berufsbegleitend</p>
                </div>
              </Reveal>
            )}

          </div>

          <aside className="space-y-6">
            <SessionCheckout
              sessions={course.sessions ?? []}
              courseId={course.id}
              courseTitle={course.title}
              courseSlug={course.slug}
              courseHero={heroDesktop}
            />
            {(course.addons ?? []).length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Add-ons</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {(course.addons ?? []).map((a: any) => (
                    <li key={a.id} className="flex justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <span>{a.name}</span>
                      <span className="font-semibold">{((a.price_cents ?? 0) / 100).toFixed(2)} €</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

      </main>

      {(course.faqs ?? []).length > 0 && (
        <section className="bg-slate-100 py-10 sm:py-12">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-20 space-y-4">
            <h3 className="text-xl font-semibold text-slate-900">FAQs</h3>
            <FaqAccordion faqs={course.faqs ?? []} />
          </div>
        </section>
      )}

      { (sloganMediaDesktop || sloganMediaMobile) && (
        <section className="relative h-[80vh] w-full overflow-hidden bg-black">
          <div className="absolute inset-0">
            {renderSloganMedia(sloganMediaDesktop, heroDesktop, false)}
            <div className="block md:hidden h-full">
              {renderSloganMedia(sloganMediaMobile, heroMobile, true)}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/55 pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <Reveal delay={80}>
              <div className="mx-auto max-w-5xl space-y-3">
                <p className="font-anton text-[clamp(56px,8vw,96px)] leading-[0.95] text-white drop-shadow-[0_12px_30px_rgba(0,0,0,0.55)]">
                  {course.slogan_line1 || "Music Mission."}
                </p>
                <p className="font-anton text-[clamp(42px,6vw,78px)] leading-[0.95] text-white drop-shadow-[0_12px_30px_rgba(0,0,0,0.55)]">
                  {course.slogan_line2 || "Lerne von den besten."}
                </p>
                <p className="text-[clamp(28px,4.5vw,52px)] text-white/85 font-semibold drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                  {course.slogan_line3 || "Für Anfänger und Fortgeschrittene"}
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <div className="relative z-20">
        <ConsultBanner overlapOffset="0" height="70vh" zIndex="z-30" />
      </div>

    </div>
  );
}

function renderSloganMedia(mediaRaw: string, fallback: string, isMobile: boolean) {
  const media = mediaRaw ? toUrl(mediaRaw) : null;
  const isVideo = media ? /\.(mp4|mov|webm)$/i.test(media) : false;
  const isVimeo = mediaRaw.includes("vimeo.com");
  const isYouTube = mediaRaw.includes("youtube.com") || mediaRaw.includes("youtu.be");

  const baseStyles = {
    width: "140%",
    height: "140%",
    transform: "translate(-50%,-50%)",
  };

  if (isVimeo) {
    const match = mediaRaw.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    const vid = match ? match[1] : null;
    if (vid) {
      const src = `https://player.vimeo.com/video/${vid}?background=1&autoplay=1&loop=1&muted=1&controls=0`;
      return (
        <iframe
          key={src + String(isMobile)}
          src={src}
          className="absolute left-1/2 top-1/2 max-w-none"
          style={baseStyles}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title="Vimeo Slogan Video"
        />
      );
    }
  }

  if (isYouTube) {
    const match = mediaRaw.match(/(?:v=|youtu\.be\/)([\w-]+)/);
    const vid = match ? match[1] : null;
    if (vid) {
      const src = `https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&loop=1&playlist=${vid}&controls=0`;
      return (
        <iframe
          key={src + String(isMobile)}
          src={src}
          className="absolute left-1/2 top-1/2 max-w-none"
          style={baseStyles}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title="YouTube Slogan Video"
        />
      );
    }
  }

  if (isVideo && media) {
    return (
      <video
        key={media + String(isMobile)}
        className="absolute left-1/2 top-1/2 w-[140%] h-[140%] object-cover -translate-x-1/2 -translate-y-1/2 bg-black"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={fallback}
        controls={false}
        crossOrigin="anonymous"
      >
        <source src={media as string} type="video/mp4" />
        <source src={media as string} />
      </video>
    );
  }

  return (
    <img
      src={media ?? fallback}
      alt="Kurs Impression"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto object-cover scale-[1.08]"
    />
  );
}
