import { SiteHeader } from "@/components/SiteHeader";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Link from "next/link";
import DynamicForm from "@/components/DynamicForm";

const toUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://naobgnbpvqgutxsaphci.supabase.co";
  const clean = path.replace(/^\/+/, "");
  if (clean.startsWith("storage/v1/object/public/") || clean.startsWith("/storage/v1/object/public/")) {
    return `${base}/${clean.replace(/^\/+/, "")}`;
  }
  if (clean.startsWith("public/")) {
    return `${base}/storage/v1/object/${clean}`;
  }
  return `${base}/storage/v1/object/public/${clean}`;
};

export const metadata = {
  title: "Tag der offenen Tür · GOSH! Studio Wien | Music Mission Institute",
  description:
    "10. April 2026: Tag der offenen Tür im GOSH! Studio Wien. Erlebe Intensivkurse, spreche mit Coaches und sichere dir deinen Platz beim Music Mission Institute.",
};

export default async function TagDerOffenenTuerPage() {
  const supabase = getSupabaseServiceClient();
  let privacyUrl: string | null = null;

  try {
    const { data: settingsRows } = await supabase.from("settings").select("key,value").in("key", ["pdf_datenschutz_url"]);
    privacyUrl = toUrl(settingsRows?.find((r: any) => r.key === "pdf_datenschutz_url")?.value ?? null);
  } catch {
    privacyUrl = null;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <main className="space-y-16">
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900/80" />
          <div className="pointer-events-none absolute right-[-6rem] top-0 h-80 w-80 rounded-full bg-pink-500/30 blur-[120px]" />
          <div className="relative z-10 mx-auto max-w-5xl space-y-10 px-6 py-16 lg:px-12">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.32em] text-white/60">Tag der offenen Tür</p>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">GOSH! Studio Wien · Live erleben</h1>
              <p className="max-w-3xl text-lg text-white/80 space-y-3">
                <span>Music Mission Institute &amp; Gosh! Audio laden zum Tag der offenen Tür ein.</span>
                <span>GOSH! Studio Wien · Einblick in die Praxis.</span>
                <span className="block mt-4">
                  Am 10. April öffnen wir die Türen des GOSH! Studios Wien. Lerne unsere Dozenten kennen, besichtige das Studio und
                  informiere dich umfassend über unsere Extrem- und Intensivkurse.
                </span>
                <span>
                  Erhalte Einblicke in Inhalte, Ablauf und Möglichkeiten der Ausbildung – und finde heraus, welcher Kurs zu dir passt.
                </span>
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-white/30 bg-white/5 px-4 py-2 font-semibold">10. April 2026</span>
                <span className="rounded-full border border-white/30 bg-white/5 px-4 py-2 font-semibold">15:00–17:00 Uhr</span>
                <span className="rounded-full border border-white/30 bg-white/5 px-4 py-2 font-semibold">Leystraße 43 · 1200 Wien</span>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 pt-16 lg:px-12" id="anmeldung">
          <div className="mx-auto max-w-3xl space-y-8 rounded-[40px] border border-slate-200/80 bg-white px-8 py-12 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.8)]">
            <div className="space-y-3 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Bereit?</p>
              <h2 className="text-3xl font-semibold text-slate-900">Jetzt anmelden</h2>
              <p className="text-base text-slate-600">
                Melde dich jetzt kostenlos zum Tag der offenen Tür des Music Mission Instituts im GOSH! Studio Wien an.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-2 sm:px-4 py-4">
              <DynamicForm formId="dc25157d-fe49-4577-adcf-962c573de612" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
