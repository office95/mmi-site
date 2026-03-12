"use client";

export default function AdminHome() {

  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <p className="tag">Admin</p>
        <h1 className="text-3xl font-semibold text-slate-900">Willkommen im Dashboard</h1>
        <p className="text-slate-500">Wähle einen Bereich:</p>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <a
            href="/admin/partners"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Partner verwalten
          </a>
          <a
            href="/admin/courses"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Kurse (bald)
          </a>
          <a
            href="/admin/badges"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Badges
          </a>
          <a
            href="/admin/media"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Medien hochladen
          </a>
          <a
            href="/admin/hero"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Hero Slides verwalten
          </a>
          <a
            href="/admin/orders"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Bestellungen
          </a>
          <a
            href="/admin/automationen"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Automationen (Doku)
          </a>
        </div>
      </div>
    </div>
  );
}
