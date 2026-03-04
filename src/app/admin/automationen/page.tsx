/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

const sections: { title: string; items: { label: string; detail: string }[] }[] = [
  {
    title: "Zahlungen & Webhooks (Stripe)",
    items: [
      {
        label: "checkout.session.completed",
        detail:
          "Setzt Order auf paid, speichert Promotion-/Coupon-Code, erhöht Sitzplätze via RPC increment_seats. Mail an office@musicmission.at + Kunden-Bestätigung.",
      },
      {
        label: "Payment-Intent Info",
        detail: "payment_intent wird in orders.stripe_payment_intent gespeichert (Metadaten aus Checkout).",
      },
      {
        label: "Env",
        detail: "STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY müssen gesetzt sein.",
      },
    ],
  },
  {
    title: "Order-Erzeugung",
    items: [
      { label: "Nummernformat", detail: "MMI-<laufende>-<yy>, erzeugt in /api/checkout (pending → paid via Webhook)." },
      { label: "Statusflow", detail: "pending → paid; canceled aktuell manuell. Restbetrag-Handling noch offen." },
    ],
  },
  {
    title: "Region-Logik",
    items: [
      { label: "Host → Region", detail: ".at = AT, .de = DE; Preview/localhost erlaubt alle." },
      { label: "Sessions", detail: "DE-Sessions nie auf .at, AT-Sessions nie auf .de (Filter in Kursseite)." },
    ],
  },
  {
    title: "Uploads",
    items: [{ label: "/api/upload", detail: "Schreibt in Supabase Storage Bucket media, URLs via toUrl() in Frontend." }],
  },
  {
    title: "Badges (Auto-Regeln)",
    items: [
      { label: "Seats", detail: "z.B. seats<=3 → \"Letzte Plätze\" (konfigurierbar in Admin Badges)." },
      { label: "Typen", detail: "type:intensiv/extrem u.ä.; Regeln in Tabelle badges." },
    ],
  },
  {
    title: "Sitzplätze",
    items: [
      { label: "Erhöhen", detail: "Nur bei paid (Webhook) increment_seats(session_id, count)." },
      { label: "Reduzieren", detail: "Bei Storno aktuell manuell." },
    ],
  },
  {
    title: "E-Mail Versand",
    items: [
      { label: "SMTP", detail: "GMAIL_USER / GMAIL_PASS (smtp.gmail.com:465). Logging sendMail success/failed." },
      { label: "Admin-Mail", detail: "office@musicmission.at mit Kurs, Termin, Partner, Order-Link." },
      { label: "Kunden-Mail", detail: "Betreff \"Bestätigung deiner Kursbuchung\" mit Kurs/Termin/Ort." },
    ],
  },
  {
    title: "Offene Punkte",
    items: [
      { label: "Restbetrag-Reminder", detail: "Automatische Erinnerung & Zahlung des Restbetrags fehlt noch." },
      { label: "Storno-Flow", detail: "Automatisches Freigeben von Sitzplätzen bei Storno fehlt." },
    ],
  },
];

export default function AutomationenPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 sm:px-8 py-10 space-y-8">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Admin</p>
          <h1 className="text-3xl font-bold text-slate-900">Automationen</h1>
          <p className="text-slate-600">
            Übersicht über alle automatischen Abläufe (Zahlungen, E-Mails, Badges, Region-Filter). Read-only Dokumentation.
          </p>
        </div>

        <div className="grid gap-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <ul className="space-y-2 text-sm text-slate-700">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-[3px] h-2 w-2 rounded-full bg-[#ff1f8f]" />
                    <div>
                      <p className="font-semibold text-slate-900">{item.label}</p>
                      <p className="text-slate-700">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-sm text-slate-700 space-y-2">
          <p className="font-semibold">Ideen / ToDo</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Restbetrag-Reminder (E-Mail + optional Link für Restzahlung).</li>
            <li>Automatisches Freigeben von Plätzen bei Storno.</li>
            <li>Health-Check: Warn-Mail, wenn Webhook-Fehler &gt; 3x/Tag.</li>
          </ul>
        </div>

        <div className="text-sm text-slate-500">
          <Link className="text-[#ff1f8f] hover:underline" href="/admin">
            Zurück zum Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
