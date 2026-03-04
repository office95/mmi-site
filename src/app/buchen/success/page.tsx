import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function BookingSuccessPage({ searchParams }: { searchParams: { course?: string; order?: string } }) {
  const courseSlug = searchParams?.course;
  const orderId = searchParams?.order;
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <main className="max-w-4xl mx-auto px-6 py-16 text-center space-y-4">
        <p className="text-sm uppercase tracking-[0.18em] text-emerald-600">Erfolg</p>
        <h1 className="text-3xl font-bold text-slate-900">Deine Buchung war erfolgreich.</h1>
        <p className="text-slate-600">
          Vielen Dank! Du erhältst gleich eine Bestätigung per E-Mail.{" "}
          {orderId ? <>Bestell-ID: <span className="font-semibold">{orderId}</span></> : null}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link href="/entdecken" className="btn-outline">Weitere Termine ansehen</Link>
          {courseSlug && (
            <Link href={`/kurs/${courseSlug}`} className="btn-primary">
              Zur Kursseite
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
