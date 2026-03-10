import { CourseMarketingInput, EligibilityResult } from "./types";

const REQUIRED_FIELDS: { key: keyof CourseMarketingInput | "session.start_date" | "session.city"; label: string }[] = [
  { key: "courseTitle", label: "Kurstitel" },
  { key: "summary", label: "Kurzbeschreibung" },
  { key: "audience", label: "Zielgruppe" },
  { key: "bookingUrl", label: "Anmeldelink" },
  { key: "session.start_date", label: "Kurstermin / Datum" },
  { key: "session.city", label: "Ort oder Online-Info" },
  { key: "partner", label: "Veranstalter" },
  { key: "image", label: "Bild" },
];

export function checkEligibility(input: CourseMarketingInput): EligibilityResult {
  const missing: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (field.key === "session.start_date") {
      if (!input.session?.start_date) missing.push(field.label);
      continue;
    }
    if (field.key === "session.city") {
      const hasLocation = input.session?.city || input.session?.state || input.partner?.city || input.partner?.state;
      if (!hasLocation) missing.push(field.label);
      continue;
    }

    const value = (input as any)[field.key];
    const empty = value === null || value === undefined || (typeof value === "string" && value.trim().length === 0);
    if (empty) missing.push(field.label);
  }

  return { eligible: missing.length === 0, missing };
}

