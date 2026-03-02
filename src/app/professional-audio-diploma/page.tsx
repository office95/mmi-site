"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";

const heroImg =
  "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/b4f50227-9cbd-44d9-8947-2afdf30e801d.webp";

export default function ProfessionalAudioDiplomaPage() {
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"kurs" | "faq">("kurs");
  const [openFaq, setOpenFaq] = useState<number>(0);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => setSending(false), 800);
  };

  const semesters = [
    {
      title: "1. Semester – Audio Engineer",
      points: ["Recording Basics", "Mikrofonierung", "Editing & Workflow", "30 ECTS"],
    },
    {
      title: "2. Semester – Music Producer",
      points: ["Producing & Arrangement", "Sound Design", "Mixing Essentials", "30 ECTS"],
    },
    {
      title: "3. Semester – Live & Mastering",
      points: ["Live-Tontechnik", "Mastering Basics", "DJing", "Praktikum", "30 ECTS"],
    },
    {
      title: "4. Semester – Advanced Mixing",
      points: ["Advanced Recording", "Mixing & Mastering Deep Dive", "Key Competences", "30 ECTS"],
    },
    {
      title: "5. Semester – Bachelor Top-Up",
      points: ["Applied Research", "Projects & Portfolio", "30 ECTS"],
    },
    {
      title: "6. Semester – Bachelor Top-Up",
      points: ["Abschlussprojekt", "Praxis & Defense", "30 ECTS"],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style jsx global>{`
        /* Banner global ausblenden nur auf dieser Seite */
        .consult-banner {
          display: none;
        }
      `}</style>
      <SiteHeader />

      {/* Hero */}
      <section className="relative h-[60vh] w-full overflow-hidden text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImg} alt="Professional Audio Diploma" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/40 to-black/15" />
        <div className="absolute inset-0 flex items-start px-6 lg:px-20 pt-[10%]">
          <div className="max-w-4xl space-y-4 drop-shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
            <p className="text-sm uppercase tracking-[0.28em] text-white/80">Studiengang</p>
            <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl leading-tight">Professional Audio Diploma – Tontechnik</h1>
            <div className="flex flex-wrap gap-3">
              <a
                href="#anmeldung"
                className="rounded-full bg-[#ff1f8f] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/40 hover:-translate-y-0.5 transition"
              >
                Jetzt anmelden
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-6 pt-0 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-5xl border-b border-slate-200">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[
              { id: "kurs", label: "Kurs" },
              { id: "faq", label: "FAQs" },
            ].map((t) => (
              <button
                key={t.id}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === t.id ? "bg-[#ff1f8f] text-white shadow-md shadow-pink-500/30" : "text-slate-700 hover:bg-slate-100"
                }`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-5xl py-6 text-slate-700 leading-relaxed">
          {activeTab === "kurs" && (
            <div className="space-y-4">
              <div className="space-y-4">
                <p>
                  Das Professional Diploma in Tontechnik eröffnet Ihnen eine einzigartige Möglichkeit: Es berechtigt Sie zum direkten Einstieg in das einjährige Top-Up Bachelor Programm
                  „Audioproduktion (B.Sc.)“. Auch ohne Matura oder Berufsreifeprüfung können Sie so einen international anerkannten Bachelorabschluss erlangen – die ideale Basis für eine
                  erfolgreiche Karriere im Bereich der Tontechnik und Audioproduktion.
                </p>
                <p>
                  Doch das Professional Audio Diploma des Music Mission Institute bietet Ihnen weit mehr als nur eine akademische Perspektive: Es ist Ihre Eintrittskarte in die
                  professionelle Welt der Audioproduktion.
                </p>
                <h3 className="text-lg font-semibold text-slate-900">Ihre Ausbildung, Ihr Erfolg</h3>
                <p>
                  Dieses hochwertige Ausbildungsprogramm kombiniert modernste Technologien, kreative Methoden und praxisorientierte Ansätze. Sie lernen von erfahrenen Branchenprofis, die
                  wertvolles Wissen aus erster Hand teilen und Sie Schritt für Schritt auf die Herausforderungen der Audioindustrie vorbereiten.
                </p>
                <p>
                  Der Lehrplan des Professional Audio Diploma ist umfassend und innovativ. Er deckt alle entscheidenden Bereiche der Audioproduktion ab:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Recording, Mixing und Mastering</li>
                  <li>Live-Tontechnik</li>
                  <li>Social Media Marketing und Kreativtechniken</li>
                </ul>
                <p>
                  Dieser ganzheitliche Ansatz stellt sicher, dass Sie nicht nur technisch, sondern auch strategisch bestens ausgebildet sind, um im dynamischen Audiomarkt erfolgreich zu
                  sein.
                </p>
                <h3 className="text-lg font-semibold text-slate-900">Beste Perspektiven für Ihre berufliche Zukunft</h3>
                <p>Mit dem Professional Audio Diploma legen Sie den Grundstein für vielfältige Karrieremöglichkeiten in der Audioindustrie. Nach Abschluss des Programms eröffnen sich:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Tontechniker/in im Studio oder Live-Bereich</li>
                  <li>Produzent/in für Musik, Film und Medien</li>
                  <li>Sounddesigner/in für Games, Film oder Werbung</li>
                  <li>Audiotechniker/in in der Event- und Konzertbranche</li>
                  <li>Freiberufler/in oder Gründer/in im kreativen Audiobereich</li>
                </ul>
                <p>
                  Dank der praxisnahen Ausbildung und dem Fokus auf aktuelle Branchenanforderungen sind Sie bestens vorbereitet, um in einem internationalen Umfeld erfolgreich zu sein – ob
                  in etablierten Unternehmen oder als unabhängige/r Kreative/r.
                </p>
                <h3 className="text-lg font-semibold text-slate-900">Maßgeschneidert für Ihre Ziele</h3>
                <p>
                  Mit dem Professional Audio Diploma gestalten Sie Ihre Ausbildung praxisnah, zukunftsorientiert und individuell abgestimmt auf Ihre Talente und beruflichen Ziele. Es gibt
                  Ihnen genau die Werkzeuge an die Hand, die Sie brauchen, um in einer anspruchsvollen und spannenden Branche zu brillieren.
                </p>
                <p className="font-semibold text-slate-900">Starten Sie Ihre Mission – Starten Sie Ihre Zukunft!</p>
              </div>
            </div>
          )}
          {activeTab === "faq" && (
            <div className="space-y-3">
              {faqItems.map((item, idx) => (
                <div
                  key={item.q}
                  className="group rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <button
                    className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-slate-900"
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  >
                    {item.q}
                    <span className={`text-slate-500 transition ${openFaq === idx ? "rotate-90" : ""}`}>›</span>
                  </button>
                  {openFaq === idx && (
                    <div className="mt-2 text-sm text-slate-600 leading-relaxed space-y-2">
                      {item.a.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Semesterplan */}
      <section className="px-6 py-14 sm:px-10 lg:px-20 bg-slate-50">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="grid gap-8 lg:grid-cols-3 items-start">
            <div className="lg:col-span-1 space-y-2">
              <ScrollReveal>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Curriculum</p>
                <h2 className="font-anton text-3xl sm:text-4xl text-slate-900">Dein Weg zum Professional Audio Diploma</h2>
                <p className="text-slate-600 max-w-3xl">
                  Von den Grundlagen bis zur Spezialisierung: Jeder Abschnitt baut praxisnah auf, damit du sofort in Studio- oder Live-Umgebungen Ergebnisse liefern kannst.
                </p>
              </ScrollReveal>
            </div>
            <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
              {semesters.map((s, idx) => (
                <ScrollReveal key={s.title} delay={idx * 80}>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition">
                    <h3 className="text-lg font-semibold text-slate-900">{s.title}</h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {s.points.map((p) => (
                        <li key={p} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#ff1f8f]" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Formular */}
      <section id="anmeldung" className="px-6 py-16 sm:px-10 lg:px-20 bg-white">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-lg">
          <div className="space-y-2 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Anmeldung</p>
            <h2 className="font-anton text-3xl text-slate-900">Melde dich jetzt an</h2>
            <p className="text-slate-600">Wir melden uns mit allen Infos zu Startterminen, Studios und Zahlungsoptionen.</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
            <Input label="Vorname" required />
            <Input label="Nachname" required />
            <Input label="Geburtsdatum" type="date" required />
            <Input label="Telefon" type="tel" required />
            <Input label="E-Mail" type="email" required className="sm:col-span-2" />
            <Input label="Straße & Hausnummer" required className="sm:col-span-2" />
            <Input label="PLZ" required />
            <Input label="Ort" required />
            <Input label="Kursstandort" placeholder="z. B. Wien, Graz, Klagenfurt" className="sm:col-span-2" />
            <div className="sm:col-span-2 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-slate-300 text-[#ff1f8f] focus:ring-[#ff1f8f]" />
              <p className="text-sm text-slate-600">
                Ich stimme AGB und Datenschutz zu und möchte über Termine & Angebote informiert werden. Widerruf jederzeit möglich.
              </p>
            </div>
            <button
              type="submit"
              disabled={sending}
              className="sm:col-span-2 inline-flex items-center justify-center rounded-full bg-[#ff1f8f] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/40 hover:-translate-y-0.5 transition disabled:opacity-60"
            >
              {sending ? "Wird gesendet…" : "Jetzt anmelden"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900 text-right">{value}</dd>
    </div>
  );
}

function Fact({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShow(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -5% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transform-gpu transition duration-[1200ms] ${
        show ? "opacity-100 translate-y-0 scale-100 blur-0" : "opacity-0 translate-y-12 scale-[0.94] blur-[6px]"
      }`}
      style={{
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.19,1,0.22,1)",
        willChange: "transform, opacity, filter",
      }}
    >
      {children}
    </div>
  );
}

function Input({
  label,
  type = "text",
  required,
  className,
  placeholder,
}: {
  label: string;
  type?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm font-semibold text-slate-800 ${className ?? ""}`}>
      {label}
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 focus:border-[#ff1f8f] focus:outline-none"
      />
    </label>
  );
}
  const faqItems = [
    {
      q: "Was ist das Professional Diploma in Tontechnik?",
      a: [
        "Das Professional Diploma in Tontechnik ist eine praxisnahe Ausbildung, die modernste Technologien, kreative Methoden und bewährte Branchenpraxis kombiniert. Es bereitet dich optimal auf eine erfolgreiche Karriere in der Audioindustrie vor. Zudem ermöglicht es dir den direkten Einstieg in das einjährige Top-Up Bachelor-Programm „Audioproduktion (B.Sc.)“ – auch ohne Matura oder Berufsreifeprüfung.",
      ],
    },
    {
      q: "Welche Voraussetzungen muss ich erfüllen?",
      a: ["Du kannst am Professional Diploma teilnehmen, auch wenn du keine Matura oder Berufsreifeprüfung hast. Die Ausbildung steht allen offen, die sich für Audioproduktion begeistern und beruflich weiterkommen wollen."],
    },
    {
      q: "Was lerne ich während der Ausbildung?",
      a: [
        "Der Lehrplan ist umfassend und deckt alle wichtigen Bereiche der Audioproduktion ab, darunter:",
        "Recording, Mixing und Mastering",
        "Live-Tontechnik",
        "Social Media Marketing und Kreativtechniken",
      ],
    },
    {
      q: "Wer bringt mir die Inhalte bei?",
      a: [
        "Deine Dozenten sind absolute Top-Profis in der Branche. Sie teilen ihr Wissen direkt mit dir – und das mitten im Studio. Du profitierst von ihrer langjährigen Erfahrung und lernst praxisnah, wie du deine Fähigkeiten in der echten Welt der Audioproduktion einsetzt.",
      ],
    },
    {
      q: "Wie unterstützt mich das Programm bei meinem Karrierestart?",
      a: [
        "Durch die praxisnahe Ausbildung, kombiniert mit einem Fokus auf aktuelle Branchenanforderungen, bist du perfekt gerüstet, um in der internationalen Audioindustrie durchzustarten – egal ob bei etablierten Unternehmen oder als unabhängige/r Kreative/r.",
        "Zudem profitierst du als Teilnehmer vom exklusiven Music Mission Netzwerk, das dir direkten Zugang zu wertvollen Kontakten in der Branche bietet.",
        "Ein weiteres Highlight ist die Möglichkeit, dich mit unserer Music Mission Community zu vernetzen. Hier kannst du dich direkt mit anderen Teilnehmern, Absolventen und Profis austauschen und gemeinsam wachsen.",
      ],
    },
    {
      q: "Wie lange dauert das Programm?",
      a: ["Das Professional Audio Diploma dauert insgesamt 4 Semester und kann berufsbegleitend absolviert werden. Dadurch hast du die Möglichkeit, deine Ausbildung mit deinen aktuellen beruflichen oder privaten Verpflichtungen zu kombinieren."],
    },
    {
      q: "Welche Finanzierungsmöglichkeiten gibt es?",
      a: [
        "In Kürze bieten wir auf dieser Seite ein herausragendes Finanzierungsmodell für das Professionell Audio Diploma an. Bleiben Sie dran und verpassen Sie nicht die Chance, Ihre Weiterbildung noch flexibler und einfacher zu gestalten!",
      ],
    },
  ];
