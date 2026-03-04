import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function BookingCancelPage({ searchParams }: { searchParams: { course?: string } }) {
  const courseSlug = searchParams?.course;
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <main className="max-w-4xl mx-auto px-6 py-16 text-center space-y-4">
        <p className="text-sm uppercase tracking-[0.18em] text-amber-600">Abgebrochen</p>
        <h1 className="text-3xl font-bold text-slate-900">Buchung abgebrochen.</h1>
        <p className="text-slate-600">Du hast den Checkout abgebrochen. Du kannst es jederzeit erneut versuchen.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link href="/entdecken" className="btn-outline">Zu allen Terminen</Link>
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
