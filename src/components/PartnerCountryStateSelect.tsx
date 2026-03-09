"use client";

import { useMemo, useState } from "react";

const statesAT = ["Burgenland", "Kärnten", "Niederösterreich", "Oberösterreich", "Salzburg", "Steiermark", "Tirol", "Vorarlberg", "Wien"];
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

type Props = { required?: boolean };

export function PartnerCountryStateSelect({ required = true }: Props) {
  const [country, setCountry] = useState<"AT" | "DE" | "">("AT");
  const [stateVal, setStateVal] = useState<string>("");
  const states = useMemo(() => (country === "DE" ? statesDE : statesAT), [country]);

  return (
    <>
      <label className="space-y-1 text-sm text-slate-700">
        Land {required && "*"}
        <select
          name="land"
          required={required}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30"
          value={country}
          onChange={(e) => {
            const val = (e.target.value as "AT" | "DE" | "") || "";
            setCountry(val);
            setStateVal("");
          }}
        >
          <option value="">Bitte wählen</option>
          <option value="AT">Österreich</option>
          <option value="DE">Deutschland</option>
        </select>
      </label>
      <label className="space-y-1 text-sm text-slate-700">
        Bundesland {required && "*"}
        <select
          name="bundesland"
          required={required}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#ff1f8f] focus:ring-[#ff1f8f]/30"
          value={stateVal}
          onChange={(e) => setStateVal(e.target.value)}
        >
          <option value="">Bitte wählen</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
