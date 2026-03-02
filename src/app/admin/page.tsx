 "use client";

export default function AdminHome() {
  const wipe = async () => {
    if (!confirm("Wirklich alle Partner, Kurse und Stammdaten löschen?")) return;
    const res = await fetch("/api/admin/wipe", { method: "POST" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`Fehler beim Löschen: ${j.error ?? res.status}`);
      return;
    }
    alert("Alle Daten gelöscht. Bitte Seiten neu laden.");
    window.location.reload();
  };

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
        </div>
        <div className="pt-6">
          <button
            onClick={wipe}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Alles löschen (Partner, Kurse, Stammdaten)
          </button>
        </div>
      </div>
    </div>
  );
}
