"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import { LogOut } from "lucide-react";

const ADMIN_CONTACT = "office@musicmission.at";

const nav = [
  { href: "/admin", label: "Übersicht" },
  { href: "/admin/partners", label: "Partner" },
  { href: "/admin/courses", label: "Kurse" },
  { href: "/admin/sessions", label: "Kurstermine" },
  { href: "/admin/orders", label: "Bestellungen" },
  { href: "/admin/badges", label: "Badges" },
  { href: "/admin/pages", label: "Seiten" },
  { href: "/admin/course-settings", label: "Stammdaten" },
  { href: "/admin/media", label: "Medien" },
  { href: "/admin/hero", label: "Hero" },
  { href: "/admin/header-menu", label: "Header-Menü" },
  { href: "/admin/forms", label: "Formulare" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/automationen", label: "Automationen" },
  { href: "/admin/seo-matrix", label: "SEO Matrix" },
  { href: "/admin/settings", label: "Verwaltung" },
  { href: "/admin/users", label: "Benutzer" },
];

const employeeNav = nav.filter((item) =>
  ["/admin", "/admin/partners", "/admin/courses", "/admin/sessions", "/admin/orders"].includes(item.href)
);

export default function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const pathname = usePathname();
  const [role, setRole] = useState<"admin" | "employee">("employee");

  const withRegion = (href: string) => href;

  const signOut = async () => {
    await supabase.auth.signOut();
    document.cookie = "sb-access-token=; Max-Age=0; Path=/;";
    document.cookie = "sb-refresh-token=; Max-Age=0; Path=/;";
    window.location.href = "/login";
  };

  useEffect(() => {
    const loadRole = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      const email = (user.email ?? "").trim().toLowerCase();
      if (email === ADMIN_CONTACT) {
        setRole("admin");
        return;
      }

      const metadataRole = user.user_metadata?.role;
      if (metadataRole === "admin") {
        setRole("admin");
        return;
      }

      const res = await fetch(`/api/auth/status?userId=${user.id}`, { cache: "no-store" }).catch(() => null);
      if (!res?.ok) return;
      const payload = await res.json().catch(() => ({}));
      setRole(payload.role === "admin" ? "admin" : "employee");
    };
    loadRole();
  }, [supabase.auth]);

  const filteredNav = useMemo(() => (role === "admin" ? nav : employeeNav), [role]);

  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      <aside className="hidden lg:flex w-68 flex-col border-r border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200/80">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ff1f8f] text-[13px] font-black text-white shadow-lg shadow-[#ff1f8f]/30">
            MMI
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
            <p className="text-sm font-semibold">Music Mission Institute</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 text-sm font-semibold">
          {filteredNav.map((item) => {
            const link = withRegion(item.href);
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={link}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 transition ${
                  active
                    ? "bg-[#ff1f8f] text-white shadow-md shadow-[#ff1f8f]/30"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 pb-4">
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 bg-gradient-to-br from-white via-[#fff5fb] to-[#f3f5ff]">
        <header className="lg:hidden flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ff1f8f] text-[12px] font-black text-white">
              M
            </span>
            <span>MMI Admin</span>
          </div>
          <button
            onClick={signOut}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-100"
          >
            Logout
          </button>
        </header>
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
