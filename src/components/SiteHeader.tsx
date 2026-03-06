"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";

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
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header
      className={`site-header fixed top-0 left-0 right-0 z-50 w-full text-slate-900 shadow-sm transition-colors transition-backdrop duration-200 ${
        scrolled ? "bg-white/88 backdrop-blur-xl" : "bg-white"
      }`}
    >
      <div className="flex h-14 w-full items-center pl-[2vh] pr-3 text-sm font-semibold tracking-tight sm:pr-6 lg:pr-20">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition">
          <Image
            src={FALLBACK_LOGO}
            alt="Music Mission Institute Logo"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />
          <span className="hidden sm:inline text-base">Music Mission Institute</span>
        </Link>

        <nav className="relative hidden flex-1 justify-center items-center gap-8 lg:gap-10 xl:gap-12 text-[13px] sm:text-sm xl:flex">
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
              Intensiv-Ausbildungen <ChevronDown size={14} />
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
          <Link href="/ueber-uns" className={`nav-link ${isActive("/ueber-uns") ? "underline underline-offset-4" : ""}`}>
            Über uns
          </Link>
        </nav>

        {/* Mobile Burger */}
        <button
          className="header-btn xl:hidden ml-auto mr-[2vh] inline-flex items-center justify-center rounded-full border border-slate-300 p-2 text-slate-800 hover:bg-slate-100"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menü"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`xl:hidden fixed inset-0 z-40 bg-white/85 backdrop-blur-xl px-6 py-6 overflow-y-auto transform transition-transform duration-300 ease-out ${
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
                <span>Intensiv-Ausbildungen</span>
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
                      Alle Intensiv-Ausbildungen
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
            <Link
              href="/ueber-uns"
              className={`block rounded-xl px-3 py-2 hover:bg-slate-100 ${isActive("/ueber-uns") ? "underline underline-offset-4" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              Über uns
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900 mb-1">Kontakt</p>
            <p>office@musicmission.at</p>
          </div>
        </div>
      </div>
    </header>
  );
}
