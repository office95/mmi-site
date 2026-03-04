"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

type SlotCourse = { id: string; slug: string; title: string };
type Slot = { id: string; label: string; courses: SlotCourse[] };

const SLOT_INTENSIV = "00000000-0000-0000-0000-000000000102";
const SLOT_EXTREM = "00000000-0000-0000-0000-000000000103";

export function SiteHeader() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeMenu, setActiveMenu] = useState<"discover" | "intensiv" | "extrem" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileIntensivOpen, setMobileIntensivOpen] = useState(false);
  const [mobileExtremOpen, setMobileExtremOpen] = useState(false);
  const [closeTimer, setCloseTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/settings?key=site_logo_url")
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        const url = json?.data?.[0]?.value as string | undefined;
        if (url) setLogoUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
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
    // in Spalten à 5 Einträge, mit 3vh Abstand zwischen den Blöcken
    const columns: SlotCourse[][] = [];
    for (let i = 0; i < list.length; i += 5) {
      columns.push(list.slice(i, i + 5));
    }
    return (
      <div className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="space-y-2">
            {col.map((c) => (
              <Link
                key={c.id}
                href={`/kurs/${c.slug}`}
                className="block text-sm leading-tight whitespace-nowrap text-slate-900 transition hover:text-pink-600"
              >
                {c.title}
              </Link>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <header className="site-header sticky top-0 z-50 w-full bg-white text-slate-900 shadow-sm">
      <div className="flex h-14 w-full items-center pl-[2vh] pr-3 text-sm font-semibold tracking-tight sm:pr-6 lg:pr-20">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition">
          <Image
            src={logoUrl || "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/db3152ef-7e1f-4a78-bb88-7528a892fdc4.webp"}
            alt="Music Mission Institute Logo"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />
          <span className="hidden sm:inline text-base">Music Mission Institute</span>
        </Link>

        <nav className="relative hidden flex-1 justify-center items-center gap-5 text-[13px] sm:text-sm xl:flex">
          <Link href="/entdecken" className="hover:text-pink-600">
            Entdecken
          </Link>
          <div
            onMouseEnter={() => keepOpen("intensiv")}
            onMouseLeave={armClose}
            className="relative"
          >
            <button className="header-btn inline-flex items-center gap-1 hover:text-pink-600">
              Intensiv-Ausbildungen <ChevronDown size={14} />
            </button>
            {activeMenu === "intensiv" && (
              <div
                className="absolute left-0 top-full z-50 mt-3 w-[520px] max-w-[90vw] bg-white shadow-2xl transition-all duration-150 ease-out origin-top border border-slate-200"
                onMouseEnter={() => keepOpen("intensiv")}
                onMouseLeave={armClose}
              >
                <div className="px-5 py-5">
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
            <button className="header-btn inline-flex items-center gap-1 hover:text-pink-600">
              Extremkurse <ChevronDown size={14} />
            </button>
            {activeMenu === "extrem" && (
              <div
                className="absolute left-0 top-full z-50 mt-3 w-[520px] max-w-[90vw] bg-white shadow-2xl transition-all duration-150 ease-out origin-top border border-slate-200"
                onMouseEnter={() => keepOpen("extrem")}
                onMouseLeave={armClose}
              >
                <div className="px-5 py-5">
                  {renderCourses(extremSlot?.courses ?? [])}
                </div>
              </div>
            )}
          </div>

          <Link href="/professional-audio-diploma" className="hover:text-pink-600">
            Professional Audio Diploma
          </Link>

          <Link href="/kursstandorte" className="hover:text-pink-600">
            Kursstandorte
          </Link>
          <Link href="/ueber-uns" className="hover:text-pink-600">
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
        className={`xl:hidden fixed inset-0 z-40 bg-white px-6 py-6 overflow-y-auto transform transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ pointerEvents: mobileOpen ? "auto" : "none" }}
      >
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <Image
              src={logoUrl || "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/db3152ef-7e1f-4a78-bb88-7528a892fdc4.webp"}
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

        <div className="space-y-4 text-base font-semibold">
          <Link href="/entdecken" className="block" onClick={() => setMobileOpen(false)}>
            Entdecken
          </Link>
          <button
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left font-semibold"
            onClick={() => setMobileIntensivOpen((v) => !v)}
          >
            <span>Intensiv-Ausbildungen</span>
            <ChevronDown size={16} className={`transition ${mobileIntensivOpen ? "rotate-180" : ""}`} />
          </button>
          {mobileIntensivOpen && (
            <div className="ml-3 space-y-2 text-sm font-normal text-slate-800">
              {(intensivSlot?.courses ?? []).map((c) => (
                <Link
                  key={c.id}
                  href={`/kurs/${c.slug}`}
                  className="block rounded-md px-2 py-1 hover:bg-slate-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {c.title}
                </Link>
              ))}
              <Link
                href="/intensiv"
                className="block rounded-md px-2 py-1 font-semibold text-pink-600 hover:bg-pink-50"
                onClick={() => setMobileOpen(false)}
              >
                Alle Intensiv-Ausbildungen
              </Link>
            </div>
          )}
          <button
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left font-semibold"
            onClick={() => setMobileExtremOpen((v) => !v)}
          >
            <span>Extremkurse</span>
            <ChevronDown size={16} className={`transition ${mobileExtremOpen ? "rotate-180" : ""}`} />
          </button>
          {mobileExtremOpen && (
            <div className="ml-3 space-y-2 text-sm font-normal text-slate-800">
              {(extremSlot?.courses ?? []).map((c) => (
                <Link
                  key={c.id}
                  href={`/kurs/${c.slug}`}
                  className="block rounded-md px-2 py-1 hover:bg-slate-100"
                  onClick={() => setMobileOpen(false)}
                >
                  {c.title}
                </Link>
              ))}
              <Link
                href="/extremkurs"
                className="block rounded-md px-2 py-1 font-semibold text-pink-600 hover:bg-pink-50"
                onClick={() => setMobileOpen(false)}
              >
                Alle Extremkurse
              </Link>
            </div>
          )}
          <Link href="/professional-audio-diploma" className="block" onClick={() => setMobileOpen(false)}>
            Professional Audio Diploma
          </Link>
          <Link href="/kursstandorte" className="block" onClick={() => setMobileOpen(false)}>
            Kursstandorte
          </Link>
          <Link href="/ueber-uns" className="block" onClick={() => setMobileOpen(false)}>
            Über uns
          </Link>
        </div>
      </div>
    </header>
  );
}
