import { SiteHeader } from "@/components/SiteHeader";
import DynamicForm from "@/components/DynamicForm";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default function BeratungPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-slate-50">
          <div className="mx-auto max-w-4xl px-6 sm:px-10 lg:px-16 py-12 sm:py-16 lg:py-20 space-y-6">
            <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl leading-[1.05] text-slate-900">
              Hallo, schön dass du da bist!
            </h1>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl">
              Sag uns kurz, für welchen Kurs du dich interessierst. Wir melden uns so schnell wie möglich.
            </p>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-5 sm:px-6 sm:py-6">
              <DynamicForm />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
