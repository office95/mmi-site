"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import CourseSearch from "@/components/CourseSearch";

type SlotCourse = { id: string; slug: string; title: string };
type Slot = { id: string; label: string; courses: SlotCourse[] };

const SLOT_INTENSIV = "00000000-0000-0000-0000-000000000102";
const SLOT_EXTREM = "00000000-0000-0000-0000-000000000103";

const FALLBACK_LOGO =
  process.env.NEXT_PUBLIC_SITE_LOGO_URL ||
  "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/333eb4c4-56a9-4396-bc74-4448da17ce14.webp";

export function SiteHeader() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeMenu, setActiveMenu] = useState<"discover" | "intensiv" | "extrem" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileIntensivOpen, setMobileIntensivOpen] = useState(false);
  const [mobileExtremOpen, setMobileExtremOpen] = useState(false);
  const [closeTimer, setCloseTimer] = useState<NodeJS.Timeout | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Body scroll lock, damit der Drawer auf iOS/Android nicht durch Hintergrund-Scroll blockiert wird.
  useEffect(() => {
    if (!mounted) return;
    const original = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    if (mobileOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      return () => {
        document.body.style.overflow = original.overflow;
        document.body.style.position = original.position;
        document.body.style.top = original.top;
        document.body.style.width = original.width;
        window.scrollTo(0, scrollY);
      };
    }

    return undefined;
  }, [mobileOpen, mounted]);

  useEffect(() => {
    let active = true;
    fetch("/api/header-menu", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        const data: Slot[] = json?.data ?? [];
        setSlots(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const intensivSlot = useMemo(() => slots.find((s) => s.id === SLOT_INTENSIV || s.label.toLowerCase().includes("intensiv")), [slots]);
  const extremSlot = useMemo(() => slots.find((s) => s.id === SLOT_EXTREM || s.label.toLowerCase().includes("extrem")), [slots]);

  const armClose = () => {
    if (closeTimer) clearTimeout(closeTimer);
    const t = setTimeout(() => setActiveMenu(null), 120);
    setCloseTimer(t);
  };
  const keepOpen = (m: "intensiv" | "extrem") => {
    if (closeTimer) clearTimeout(closeTimer);
    setActiveMenu(m);
  };

  const renderCourses = (list: SlotCourse[]) => {
    if (!list || list.length === 0) return <p className="text-sm text-slate-600">Noch keine Kurse zugeordnet.</p>;
    const midpoint = Math.ceil(list.length / 2);
    const columns: SlotCourse[][] = [list.slice(0, midpoint), list.slice(midpoint)];
    return (
      <div className="grid gap-8 sm:gap-10 sm:grid-cols-2">
        {columns.map((col, colIdx) => (
          <div
            key={colIdx}
            className={`space-y-2.5 ${colIdx === 1 ? "sm:border-l sm:border-slate-200/80 sm:pl-6" : ""}`}
          >
            {col.map((c) => (
              <Link
                key={c.id}
                href={`/kurs/${c.slug || c.id}`}
                className="block text-sm leading-5 whitespace-nowrap text-slate-900 transition hover:text-pink-600"
              >
                {c.title}
              </Link>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className="site-header fixed top-0 left-0 right-0 z-40 w-full" style={{ pointerEvents: "auto" }}>
      <div className="h-8 bg-black text-white flex items-center justify-center px-3">
        <h1 className="text-[11px] tracking-[0.14em] uppercase font-semibold">
          Kurse in Musikproduktion · Tontechnik · DJ · Vocalcoaching
        </h1>
      </div>
      <div
        className={`flex h-14 w-full items-center pl-[2vh] pr-3 text-sm font-semibold tracking-tight sm:pr-6 lg:pr-20 shadow-sm transition-colors transition-backdrop duration-200 flex-nowrap ${
          scrolled ? "bg-white/88 backdrop-blur-xl" : "bg-white"
        }`}
      >
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition flex-shrink-0 z-10 mr-[2vh]">
          <Image
            src={FALLBACK_LOGO}
            alt="Music Mission Institute Logo"
            width={48}
            height={48}
            className="h-12 w-12 object-contain flex-shrink-0"
            priority
          />
          <span className="hidden 2xl:inline text-base whitespace-nowrap flex-shrink-0">
            Music Mission Institute
          </span>
        </Link>

        {/* Mobile/Tablet Suche (verschwindet ab lg, dort übernimmt Desktop-Suche) */}
        <div className="flex-1 pr-2 lg:pr-4 lg:hidden min-w-[200px] flex justify-center">
          <div className="w-[80%] min-w-[200px]">
            <CourseSearch variant="compact" />
          </div>
        </div>

        {/* Entdecken-Link bleibt sichtbar, bis kaum Platz bleibt; versteckt nur auf sehr kleinen Screens bzw. wenn Desktop-Navigation aktiv */}
        <Link
          href="/entdecken"
          className={`nav-link hidden sm:inline-flex items-center px-3 py-2 font-semibold text-[13px] text-slate-900 lg:hidden ${
            isActive("/entdecken") ? "underline underline-offset-4" : ""
          }`}
        >
          Entdecken
        </Link>

        <nav className="relative hidden lg:flex flex-1 flex-nowrap whitespace-nowrap items-center justify-center gap-4 lg:gap-5 xl:gap-6 text-[13px] sm:text-sm pl-[1.5vh]">
          <div className="w-full max-w-[14rem] lg:max-w-[16rem] xl:max-w-[18rem] min-w-[14rem] flex-shrink-0">
            <CourseSearch variant="compact" />
          </div>
          <Link href="/entdecken" className={`nav-link ${isActive("/entdecken") ? "underline underline-offset-4" : ""}`}>
            Entdecken
          </Link>
          <div
            onMouseEnter={() => keepOpen("intensiv")}
            onMouseLeave={armClose}
            className="relative"
          >
            <button
              className={`header-btn nav-link inline-flex items-center gap-2 px-2 py-1 rounded-full ${
                isActive("/intensiv") ? "underline underline-offset-4" : ""
              }`}
            >
              Intensivausbildungen <ChevronDown size={14} />
            </button>
            {activeMenu === "intensiv" && (
              <div
                className="absolute left-0 top-full z-50 mt-4 w-[560px] max-w-[92vw] bg-white/95 backdrop-blur-lg shadow-2xl transition-all duration-150 ease-out origin-top border border-slate-200 rounded-2xl"
                onMouseEnter={() => keepOpen("intensiv")}
                onMouseLeave={armClose}
              >
                <div className="px-6 py-6">
                  {renderCourses(intensivSlot?.courses ?? [])}
                </div>
              </div>
            )}
          </div>

          <div
            onMouseEnter={() => keepOpen("extrem")}
            onMouseLeave={armClose}
            className="relative"
          >
            <button
              className={`header-btn nav-link inline-flex items-center gap-2 px-2 py-1 rounded-full ${
                isActive("/extrem") ? "underline underline-offset-4" : ""
              }`}
            >
              Extremkurse <ChevronDown size={14} />
            </button>
            {activeMenu === "extrem" && (
              <div
                className="absolute left-0 top-full z-50 mt-4 w-[560px] max-w-[92vw] bg-white/95 backdrop-blur-lg shadow-2xl transition-all duration-150 ease-out origin-top border border-slate-200 rounded-2xl"
                onMouseEnter={() => keepOpen("extrem")}
                onMouseLeave={armClose}
              >
                <div className="px-6 py-6">
                  {renderCourses(extremSlot?.courses ?? [])}
                </div>
              </div>
            )}
          </div>

          <Link href="/professional-audio-diploma" className={`nav-link ${isActive("/professional-audio-diploma") ? "underline underline-offset-4" : ""}`}>
            Professional Audio Diploma
          </Link>

          <Link href="/kursstandorte" className={`nav-link ${isActive("/kursstandorte") ? "underline underline-offset-4" : ""}`}>
            Kursstandorte
          </Link>
        </nav>

        {/* Mobile Burger */}
        <button
          className="header-btn lg:hidden inline-flex items-center justify-center rounded-full border border-slate-300 p-2 text-slate-800 hover:bg-slate-100 mr-5 sm:mr-6 lg:mr-8"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menü"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Drawer wird in ein Portal gehoben, damit er auch nach Scroll immer über allem liegt */}
      {mounted &&
        createPortal(
          <div
            className={`xl:hidden fixed inset-0 z-50 bg-white px-6 py-6 overflow-y-auto shadow-2xl transform transition-transform duration-300 ease-out ${
              mobileOpen ? "translate-x-0" : "translate-x-full"
            }`}
            style={{ pointerEvents: mobileOpen ? "auto" : "none" }}
          >
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <Image
                  src={FALLBACK_LOGO}
                  alt="Music Mission Institute Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  priority
                />
                <span className="text-base font-semibold">Music Mission Institute</span>
              </Link>
              <button
                className="header-btn inline-flex items-center justify-center rounded-full border border-slate-300 p-2 text-slate-800 hover:bg-slate-100"
                onClick={() => setMobileOpen(false)}
                aria-label="Menü schließen"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 text-base font-semibold">
              <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm shadow-slate-200/70 px-4 py-4 space-y-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Navigation</p>
                <Link
                  href="/entdecken"
                  className={`block rounded-xl px-3 py-2 hover:bg-slate-100 ${isActive("/entdecken") ? "underline underline-offset-4" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Entdecken
                </Link>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60">
                  <button
                    className="flex w-full items-center justify-between px-3 py-2 text-left font-semibold"
                    onClick={() => setMobileIntensivOpen((v) => !v)}
                  >
                    <span>Intensivausbildungen</span>
                    <ChevronDown size={16} className={`transition ${mobileIntensivOpen ? "rotate-180" : ""}`} />
                  </button>
                  {mobileIntensivOpen && (
                    <div className="border-t border-slate-200 bg-white">
                      <div className="space-y-1.5 px-3 py-3 text-sm font-normal text-slate-800">
                        {(intensivSlot?.courses ?? []).map((c) => (
                          <Link
                            key={c.id}
                            href={`/kurs/${c.slug || c.id}`}
                            className="block rounded-lg px-2 py-1 hover:bg-slate-100"
                            onClick={() => setMobileOpen(false)}
                          >
                            {c.title}
                          </Link>
                        ))}
                        <Link
                          href="/intensiv"
                          className="block rounded-lg px-2 py-2 font-semibold text-pink-600 hover:bg-pink-50"
                          onClick={() => setMobileOpen(false)}
                        >
                          Alle Intensivausbildungen
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60">
                  <button
                    className="flex w-full items-center justify-between px-3 py-2 text-left font-semibold"
                    onClick={() => setMobileExtremOpen((v) => !v)}
                  >
                    <span>Extremkurse</span>
                    <ChevronDown size={16} className={`transition ${mobileExtremOpen ? "rotate-180" : ""}`} />
                  </button>
                  {mobileExtremOpen && (
                    <div className="border-t border-slate-200 bg-white">
                      <div className="space-y-1.5 px-3 py-3 text-sm font-normal text-slate-800">
                        {(extremSlot?.courses ?? []).map((c) => (
                          <Link
                            key={c.id}
                            href={`/kurs/${c.slug || c.id}`}
                            className="block rounded-lg px-2 py-1 hover:bg-slate-100"
                            onClick={() => setMobileOpen(false)}
                          >
                            {c.title}
                          </Link>
                        ))}
                        <Link
                          href="/extremkurs"
                          className="block rounded-lg px-2 py-2 font-semibold text-pink-600 hover:bg-pink-50"
                          onClick={() => setMobileOpen(false)}
                        >
                          Alle Extremkurse
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href="/professional-audio-diploma"
                  className={`block rounded-xl px-3 py-2 hover:bg-slate-100 ${
                    isActive("/professional-audio-diploma") ? "underline underline-offset-4" : ""
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  Professional Audio Diploma
                </Link>
                <Link
                  href="/kursstandorte"
                  className={`block rounded-xl px-3 py-2 hover:bg-slate-100 ${isActive("/kursstandorte") ? "underline underline-offset-4" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Kursstandorte
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm px-4 py-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900 mb-1">Kontakt</p>
                <p>office@musicmission.at</p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
