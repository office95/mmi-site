"use client";

import { useMemo, useState } from "react";

const statesAT = [
  "Burgenland",
  "Kärnten",
  "Niederösterreich",
  "Oberösterreich",
  "Salzburg",
  "Steiermark",
  "Tirol",
  "Vorarlberg",
  "Wien",
];

const statesDE = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
];

type FormState = {
  studio: string;
  contact: string;
  phone: string;
  email: string;
  street: string;
  zip: string;
  city: string;
  country: "Österreich" | "Deutschland";
  state: string;
  references: string;
  courses: string;
  agree: boolean;
};

const initialState: FormState = {
  studio: "",
  contact: "",
  phone: "",
  email: "",
  street: "",
  zip: "",
  city: "",
  country: "Österreich",
  state: "",
  references: "",
  courses: "",
  agree: false,
};

export default function PartnerLeadForm() {
  const [data, setData] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const states = useMemo(() => (data.country === "Österreich" ? statesAT : statesDE), [data.country]);

  const update = (key: keyof FormState, value: FormState[typeof key]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const requiredFields: (keyof FormState)[] = ["studio", "contact", "phone", "email", "street", "zip", "city", "country", "state"];

  const handleSubmit = () => {
    setError(null);
    setSent(false);
    for (const k of requiredFields) {
      if (!data[k]) {
        setError("Bitte alle Pflichtfelder ausfüllen.");
        return;
      }
    }
    if (!data.agree) {
      setError("Bitte den rechtlichen Hinweis bestätigen.");
      return;
    }
    const mailto = new URL("mailto:office@musicmission.at");
    mailto.searchParams.set("subject", "Partner werden – Anfrage");
    const body = [
      `Studio/Firma: ${data.studio}`,
      `Ansprechperson: ${data.contact}`,
      `Telefon: ${data.phone}`,
      `Email: ${data.email}`,
      `Adresse: ${data.street}, ${data.zip} ${data.city}`,
      `Land/Bundesland: ${data.country}, ${data.state}`,
      data.references ? `Referenzen: ${data.references}` : null,
      data.courses ? `Kurse: ${data.courses}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    mailto.searchParams.set("body", body);
    // Öffnet Mail-Client – fallback, falls blockiert
    window.location.href = mailto.toString();
    setSent(true);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_18px_60px_-36px_rgba(0,0,0,0.25)]">
      <div className="space-y-1 mb-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Anfrage senden</p>
        <h3 className="font-anton text-2xl text-slate-900">Jetzt Partner werden</h3>
        <p className="text-sm text-slate-600">Pflichtfelder sind markiert *</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-slate-700">
          Studio oder Firmenname *
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30"
            value={data.studio}
            onChange={(e) => update("studio", e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          Ansprechpartner *
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30"
            value={data.contact}
            onChange={(e) => update("contact", e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          Telefon *
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30"
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          E-Mail *
          <input
            type="email"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
          Straße / Nr. *
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30"
            value={data.street}
            onChange={(e) => update("street", e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          PLZ *
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30"
            value={data.zip}
            onChange={(e) => update("zip", e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          Ort *
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30"
            value={data.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          Land *
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30"
            value={data.country}
            onChange={(e) => update("country", e.target.value as FormState["country"])}
          >
            <option>Österreich</option>
            <option>Deutschland</option>
          </select>
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          Bundesland *
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30"
            value={data.state}
            onChange={(e) => update("state", e.target.value)}
          >
            <option value="">Bitte wählen</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
          Referenzen (optional)
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30"
            rows={3}
            value={data.references}
            onChange={(e) => update("references", e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
          Welche Kurse könnte ich anbieten? (optional)
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30"
            rows={3}
            value={data.courses}
            onChange={(e) => update("courses", e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 space-y-3">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={data.agree}
            onChange={(e) => update("agree", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#ff1f8f] focus:ring-[#ff1f8f]"
          />
          <span>
            Ich bestätige die rechtlichen Hinweise und die Verarbeitung meiner Daten zur Kontaktaufnahme. *</n>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {sent && !error && <p className="text-sm text-emerald-600">Danke! Dein Mail-Client wurde geöffnet. Falls nicht, schreib uns an office@musicmission.at.</p>}
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-[#ff1f8f] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#ff1f8f]/30 hover:bg-[#e0007a]"
        >
          Anfrage senden
        </button>
      </div>
    </div>
  );
}
