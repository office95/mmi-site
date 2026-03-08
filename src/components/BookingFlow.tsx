"use client";

import { useState } from "react";

type SessionInfo = {
  id: string;
  start_date?: string | null;
  start_time?: string | null;
  city?: string | null;
  price_cents?: number | null;
  deposit_cents?: number | null;
};

type CourseInfo = {
  id: string;
  title: string;
  slug: string;
  base_price_cents?: number | null;
  deposit_cents?: number | null;
  tax_rate?: number | null;
};

export default function BookingFlow({
  session,
  course,
  agbUrl,
  privacyUrl,
}: {
  session: SessionInfo;
  course: CourseInfo;
  agbUrl?: string | null;
  privacyUrl?: string | null;
}) {
  const [step, setStep] = useState<"form" | "summary" | "processing">("form");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Österreich");
  const [dob, setDob] = useState("");
  const [participants] = useState(1);
  const [isCompany, setIsCompany] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyUid, setCompanyUid] = useState("");
  const [coupon, setCoupon] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fmt = new Intl.NumberFormat("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const price = session.price_cents ?? course.base_price_cents ?? 0; // Brutto je TN
  const deposit = session.deposit_cents ?? course.deposit_cents ?? null;
  const totalFull = price * participants; // Gesamtpreis Brutto aller TN
  const totalCharge = (deposit ?? price) * participants; // Brutto fällig jetzt (Anzahlung oder Gesamt)
  const rawTax = course.tax_rate ?? 0;
  const taxRate = rawTax > 1 ? rawTax / 100 : rawTax; // 0.2 statt 20
  const grossNow = totalCharge;
  const netNow = taxRate ? grossNow / (1 + taxRate) : grossNow;
  const vatNow = grossNow - netNow;
  const remainingGross = deposit ? Math.max(totalFull - totalCharge, 0) : 0;

  const steps: { key: "form" | "summary" | "payment"; label: string }[] = [
    { key: "form", label: "Daten" },
    { key: "summary", label: "Übersicht" },
    { key: "payment", label: "Zahlung" },
  ];
  const stepIndex = (s: typeof steps[number]["key"]) => steps.findIndex((it) => it.key === s);
  const currentIdx = stepIndex(step === "processing" ? "payment" : step);

  const proceed = async () => {
    if (step === "form") {
      const requiredFields = [
        { value: firstName, label: "Vorname" },
        { value: lastName, label: "Nachname" },
        { value: email, label: "E-Mail" },
        { value: phone, label: "Telefon" },
        { value: street, label: "Straße / Nr." },
        { value: zip, label: "PLZ" },
        { value: city, label: "Ort" },
        { value: country, label: "Land" },
      ];
      const missing = requiredFields.find((f) => !String(f.value || "").trim());
      if (missing) {
        setError(`${missing.label} ist erforderlich`);
        return;
      }
      if (!consent) {
        setError("Bitte Datenschutzhinweis akzeptieren");
        return;
      }
      setError(null);
      setStep("summary");
      return;
    }
    // summary -> checkout
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          courseId: course.id,
          email,
          first_name: firstName,
          last_name: lastName,
          customer_name: `${firstName} ${lastName}`.trim(),
          phone,
          participants,
          street,
          zip,
          city,
          country,
          dob,
          is_company: isCompany,
          company_name: isCompany ? companyName : undefined,
          company_uid: isCompany ? companyUid : undefined,
          coupon_code: coupon || undefined,
          consent_gdpr: consent,
        }),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Serverantwort ist ungültig: ${text.slice(0, 120)}`);
      }
      if (!res.ok) throw new Error(data.error || "Fehler beim Checkout");
      if (data.url) window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || "Unbekannter Fehler");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
          {steps.map((s, idx) => {
            const active = idx <= currentIdx;
            return (
              <div key={s.key} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-center">
                  {idx > 0 && (
                    <div
                      className="h-[2px] flex-1"
                      style={{
                        background: active ? "linear-gradient(90deg,#ff1f8f 0%, #0f172a 100%)" : "rgba(148,163,184,0.6)",
                      }}
                    />
                  )}
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold ${
                      active
                        ? "border-[#ff1f8f] bg-[#ff1f8f]/10 text-[#0f172a]"
                        : "border-slate-300 bg-white text-slate-400"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className="h-[2px] flex-1"
                      style={{
                        background: idx < currentIdx ? "linear-gradient(90deg,#0f172a 0%, #ff1f8f 100%)" : "rgba(148,163,184,0.6)",
                      }}
                    />
                  )}
                </div>
                <span className={`text-[11px] uppercase tracking-[0.16em] ${active ? "text-slate-700" : "text-slate-400"}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {step === "form" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-anton text-slate-900">Deine Daten</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm space-y-1">
              <span>Vorname *</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </label>
            <label className="text-sm space-y-1">
              <span>Nachname *</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm space-y-1">
              <span>E-Mail *</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="text-sm space-y-1">
              <span>Telefon *</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="grid gap-3">
            <label className="text-sm space-y-1">
              <span>Straße / Nr. *</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr]">
            <label className="text-sm space-y-1">
              <span>PLZ *</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                required
              />
            </label>
            <label className="text-sm space-y-1">
              <span>Ort *</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm space-y-1 sm:col-span-2">
              <span>Land *</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm space-y-1">
              <span>Geburtsdatum</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 pt-6">
              <input type="checkbox" checked={isCompany} onChange={(e) => setIsCompany(e.target.checked)} />
              <span>Als Firma buchen</span>
            </label>
          </div>
          {isCompany && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm space-y-1">
                <span>Firmenname</span>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </label>
              <label className="text-sm space-y-1">
                <span>UID</span>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:outline-none"
                  value={companyUid}
                  onChange={(e) => setCompanyUid(e.target.value)}
                />
              </label>
            </div>
          )}
          {/* Teilnehmer-Dropdown oben, Gutschein-Feld ausgeblendet */}
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              Ich akzeptiere die{" "}
              {agbUrl ? (
                <a href={agbUrl} target="_blank" rel="noreferrer" className="text-pink-600 hover:text-pink-700 underline underline-offset-2">
                  AGB
                </a>
              ) : (
                <span className="underline underline-offset-2">AGB</span>
              )}{" "}
              und die{" "}
              {privacyUrl ? (
                <a href={privacyUrl} target="_blank" rel="noreferrer" className="text-pink-600 hover:text-pink-700 underline underline-offset-2">
                  Datenschutzerklärung
                </a>
              ) : (
                <span className="underline underline-offset-2">Datenschutzerklärung</span>
              )}{" "}
              und stimme der Verarbeitung meiner Daten gemäß DSGVO zu.
            </span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-[11px] text-slate-500">* Pflichtfeld</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setStep("summary")}
              className="rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-white shadow shadow-[#ff1f8f]/30"
            >
              Weiter
            </button>
          </div>
        </div>
      )}

      {step === "summary" && (
        <div className="space-y-5">
          <h2 className="text-2xl font-anton text-slate-900">Bestellübersicht</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Buchung</p>
                {course.tax_rate !== 0 && course.tax_rate !== null && course.tax_rate !== undefined && (
                  <span className="text-[11px] font-semibold text-slate-600">Preise inkl. MwSt.</span>
                )}
              </div>
              <p className="font-semibold text-slate-900">{course.title}</p>
              <p className="text-sm text-slate-700">
                Termin: {session.start_date ?? "Datum folgt"}
                {session.city ? ` · ${session.city}` : ""}
              </p>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-3 text-sm text-slate-800">
                <div className="flex items-center justify-between">
                  <span>Preis</span>
                  <span className="font-semibold">{fmt.format(price / 100)} €</span>
                </div>
                {deposit !== null && (
                  <div className="flex items-center justify-between">
                    <span>Anzahlung (jetzt)</span>
                    <span className="font-semibold">{fmt.format(deposit / 100)} €</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-900 font-semibold border-t border-slate-100 pt-2">
                  <span>{deposit ? "Jetzt fällig (Anzahlung, brutto)" : "Jetzt fällig (Brutto)"}</span>
                  <span>{fmt.format(grossNow / 100)} €</span>
                </div>
                {course.tax_rate === 0 ? (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    Steuerfreie Bildungsmaßnahme gemäß § 6 Abs. 1 Z 11 UStG.
                  </p>
                ) : taxRate ? (
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Enthaltene USt ({(taxRate * 100).toFixed(1)} %)</span>
                      <span>{fmt.format(vatNow / 100)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Netto (fällig)</span>
                      <span>{fmt.format(netNow / 100)} €</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">Preise inkl. USt.</p>
                )}
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Gesamtpreis (brutto)</span>
                  <span>{fmt.format(totalFull / 100)} €</span>
                </div>
                {deposit && remainingGross > 0 && (
                  <div className="text-xs text-slate-600">
                    Restbetrag (brutto): {fmt.format(remainingGross / 100)} € – fällig zum Kursstart.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Kundendaten</p>
              <div className="text-sm text-slate-800 space-y-1">
                <p className="font-semibold">{[firstName, lastName].filter(Boolean).join(" ") || "—"}</p>
                <p>{email}</p>
                {phone && <p>{phone}</p>}
                <p>{[street, zip, city, country].filter(Boolean).join(", ")}</p>
                {dob && <p>Geburtsdatum: {dob}</p>}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-between gap-3">
            <button onClick={() => setStep("form")} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Zurück
            </button>
            <button
              disabled={loading}
              onClick={proceed}
              className="rounded-xl bg-[#ff1f8f] px-4 py-2 text-sm font-semibold text-black shadow shadow-[#ff1f8f]/30 disabled:opacity-60"
            >
              {loading ? "Weiter..." : "Zur Zahlung"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// small helper class for consistent inputs
// tailwind in globals: .input added via className strings above
