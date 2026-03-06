"use client";

import { FormEvent, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";

const heroImg =
  "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/b4f50227-9cbd-44d9-8947-2afdf30e801d.webp";

export default function ProfessionalAudioDiplomaClient() {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"kurs" | "faq">("kurs");
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    birthdate: "",
    phone: "",
    email: "",
    street: "",
    zip: "",
    city: "",
    location_preference: "",
    consent: false,
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSending(true);
    try {
      const res = await fetch("/api/diploma/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Senden fehlgeschlagen");
      setSuccess("Danke! Wir melden uns in Kürze mit allen Infos.");
      setForm({
        first_name: "",
        last_name: "",
        birthdate: "",
        phone: "",
        email: "",
        street: "",
        zip: "",
        city: "",
        location_preference: "",
        consent: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Senden fehlgeschlagen");
    } finally {
      setSending(false);
    }
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
            <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl leading-tight">Professional Audio Diploma – 180 ECTS Tontechnik & Produktion</h1>
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

      <section className="px-6 pt-0 sm:px-10 lg:px-20">
        <div className="flex items-center gap-4 border-b border-slate-200 py-4">
          <button
            onClick={() => setActiveTab("kurs")}
            className={`pb-2 text-sm font-semibold ${activeTab === "kurs" ? "text-pink-600 border-b-2 border-pink-600" : "text-slate-600"}`}
          >
            Kursinfo
          </button>
          <button
            onClick={() => setActiveTab("faq")}
            className={`pb-2 text-sm font-semibold ${activeTab === "faq" ? "text-pink-600 border-b-2 border-pink-600" : "text-slate-600"}`}
          >
            FAQ
          </button>
        </div>
      </section>

      {activeTab === "kurs" && (
        <>
          <section className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-20 py-10 space-y-8">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
              <div className="space-y-5">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Das Professional Audio Diploma ist ein berufsbegleitender Studiengang über sechs Semester. Du lernst Recording,
                  Mixing, Mastering, Live-Tontechnik, DJing, Sounddesign und Business-Skills mit aktiven Profis aus der Branche.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Dauer", value: "6 Semester" },
                    { label: "ECTS", value: "180 ECTS" },
                    { label: "Modus", value: "Berufsbegleitend" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-white shadow-sm px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                      <p className="text-base font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Aufbau (Module)</p>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {semesters.map((s) => (
                      <li key={s.title} className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm">
                        <p className="font-semibold text-slate-900 mb-2">{s.title}</p>
                        <ul className="space-y-1 text-sm text-slate-700 list-disc list-inside">
                          {s.points.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md space-y-4">
                <p className="text-sm font-semibold text-slate-900">Darum Professional Audio Diploma</p>
                <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
                  <li>Praxis mit echten Produktionen & Live-Shows</li>
                  <li>Dozent:innen aus der Industrie</li>
                  <li>6 Semester, 180 ECTS, berufsbegleitend</li>
                  <li>Recording, Mixing, Mastering, Live-Sound, DJing</li>
                  <li>Top-Up Bachelor im 5./6. Semester</li>
                </ul>
                <a
                  href="#anmeldung"
                  className="inline-flex items-center justify-center rounded-full bg-[#ff1f8f] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-pink-500/30 hover:-translate-y-0.5 transition"
                >
                  Zum Formular
                </a>
              </div>
            </div>
          </section>

          <section id="anmeldung" className="bg-slate-900 text-white py-12 px-6 sm:px-10 lg:px-20">
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="space-y-2 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-pink-200">Interesse</p>
                <h2 className="font-anton text-3xl sm:text-4xl leading-tight">Jetzt für das Diploma vormerken</h2>
                <p className="text-sm text-white/70 max-w-2xl mx-auto">
                  Wir melden uns mit Startterminen, Standorten und nächsten Schritten.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md p-6 sm:p-8 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      required
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      placeholder="Vorname"
                      className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60"
                    />
                    <input
                      required
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      placeholder="Nachname"
                      className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60"
                    />
                    <input
                      value={form.birthdate}
                      onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                      placeholder="Geburtsdatum"
                      className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60"
                    />
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Telefon"
                      className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60"
                    />
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="E-Mail"
                      className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60"
                    />
                    <input
                      value={form.location_preference}
                      onChange={(e) => setForm({ ...form, location_preference: e.target.value })}
                      placeholder="Wunsch-Standort"
                      className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60"
                    />
                    <input
                      value={form.street}
                      onChange={(e) => setForm({ ...form, street: e.target.value })}
                      placeholder="Straße"
                      className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        value={form.zip}
                        onChange={(e) => setForm({ ...form, zip: e.target.value })}
                        placeholder="PLZ"
                        className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60"
                      />
                      <input
                        className="col-span-2 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="Ort"
                      />
                    </div>
                  </div>
                  <label className="flex items-start gap-2 text-xs text-white/80">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                      className="mt-1"
                      required
                    />
                    <span>
                      Ich stimme zu, dass meine Daten zur Kontaktaufnahme für das Professional Audio Diploma verarbeitet werden.
                    </span>
                  </label>
                  {error ? <p className="text-sm text-red-200">{error}</p> : null}
                  {success ? <p className="text-sm text-emerald-200">{success}</p> : null}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full rounded-full bg-[#ff1f8f] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-pink-500/30 hover:-translate-y-0.5 transition disabled:opacity-60"
                  >
                    {sending ? "Senden…" : "Anfrage senden"}
                  </button>
                </form>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === "faq" && (
        <section className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-20 py-10 space-y-4">
          {[
            { q: "Wann startet der nächste Jahrgang?", a: "Wir planen aktuell den nächsten Start; nach Anfrage informieren wir dich mit Terminen." },
            { q: "Ist das berufsbegleitend?", a: "Ja, die meisten Einheiten finden abends und an ausgewählten Wochenenden statt." },
            { q: "Gibt es ECTS?", a: "Ja, pro Semester 30 ECTS; insgesamt 180 ECTS nach Abschluss." },
          ].map((item, idx) => (
            <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <button
                className="w-full text-left flex items-center justify-between gap-4"
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
              >
                <span className="font-semibold text-slate-900">{item.q}</span>
                <span className="text-pink-600">{openFaq === idx ? "–" : "+"}</span>
              </button>
              {openFaq === idx && <p className="mt-3 text-sm text-slate-700">{item.a}</p>}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
