import { Branding, CampaignTemplateKind, CourseMarketingInput, GeneratedContent, Platform } from "./types";

const formatDate = (iso?: string | null) => {
  if (!iso) return "bald";
  try {
    return new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("de-AT", { day: "2-digit", month: "short" });
  } catch {
    return "bald";
  }
};

const formatLocation = (input: CourseMarketingInput) => {
  const loc = input.session?.city || input.session?.state || input.partner?.city || input.partner?.state;
  return loc || "On Campus";
};

const formatPrice = (cents?: number | null) => {
  if (!cents || cents <= 0) return "";
  return `${(cents / 100).toFixed(2)} €`;
};

const defaultCta = (branding?: Branding | null) => branding?.defaultCta || "Platz sichern";

const pickHashtags = (input: CourseMarketingInput, branding?: Branding | null) => {
  const base: string[] = [];
  if (branding?.defaultHashtags?.length) base.push(...branding.defaultHashtags.map((h) => h.replace(/#/g, "")));
  (input.tags ?? []).forEach((t) => {
    const clean = t.replace(/#/g, "").trim();
    if (clean) base.push(clean);
  });
  const loc = formatLocation(input).replace(/\s+/g, "");
  if (loc) base.push(loc);
  const dedup = Array.from(new Set(base.map((h) => h.toLowerCase())));
  return dedup.slice(0, 10).map((h) => `#${h}`);
};

const headline = (input: CourseMarketingInput, tpl: CampaignTemplateKind) => {
  const title = input.courseTitle;
  const loc = formatLocation(input);
  const date = formatDate(input.session?.start_date);
  switch (tpl) {
    case "new_course":
      return `${title}: neu in ${loc}`;
    case "starts_soon":
      return `${title} am ${date}`;
    case "last_seats":
      return `Letzte Plätze: ${title}`;
    case "new_date":
      return `Neuer Termin in ${loc}`;
    case "enroll_today":
      return `${title}: jetzt anmelden`;
    case "partner_spotlight":
      return `${input.partner?.name ?? "Partner"} x ${title}`;
    default:
      return title;
  }
};

function buildCaption(platform: Platform, tpl: CampaignTemplateKind, input: CourseMarketingInput, branding?: Branding | null) {
  const date = formatDate(input.session?.start_date);
  const loc = formatLocation(input);
  const price = formatPrice(input.session?.price_cents);
  const cta = defaultCta(branding);
  const partner = input.partner?.name ? `bei ${input.partner.name}` : "";

  const base = {
    instagram: (body: string) => `${body}\n${cta} → ${input.bookingUrl}`,
    facebook: (body: string) => `${body}\n${cta}: ${input.bookingUrl}`,
    tiktok: (body: string) => `${body} · ${cta} (${input.bookingUrl})`,
  }[platform];

  const body = (() => {
    switch (tpl) {
      case "new_course":
        return `${input.courseTitle} – ${input.summary || "Neu am Start"}. ${loc}${price ? " · " + price : ""}${partner ? " · " + partner : ""}`.trim();
      case "starts_soon":
        return `${input.courseTitle} am ${date}${input.session?.start_time ? " · " + input.session.start_time.slice(0, 5) + " Uhr" : ""}${loc ? " · " + loc : ""}${price ? " · " + price : ""}${partner ? " · " + partner : ""}`.trim();
      case "last_seats":
        return `Letzte Plätze: ${input.courseTitle} am ${date}${input.session?.start_time ? " · " + input.session.start_time.slice(0, 5) + " Uhr" : ""}${loc ? " · " + loc : ""}${price ? " · " + price : ""}`.trim();
      case "new_date":
        return `Neuer Termin: ${input.courseTitle} am ${date} in ${loc}.`;
      case "enroll_today":
        return `Heute anmelden: ${input.courseTitle}${loc ? " · " + loc : ""}${price ? " · " + price : ""}.`;
      case "partner_spotlight":
        return `${input.partner?.name ?? "Partner"} hostet ${input.courseTitle} in ${loc}. ${input.summary || ""}`.trim();
      default:
        return input.courseTitle;
    }
  })();

  return base(body);
}

function buildTiktokScript(tpl: CampaignTemplateKind, input: CourseMarketingInput): GeneratedContent["tiktokScript"] {
  const date = formatDate(input.session?.start_date);
  const loc = formatLocation(input);
  const cta = defaultCta(input.organizerBranding);
  return {
    hook:
      tpl === "last_seats"
        ? `Letzte Plätze für ${input.courseTitle}`
        : `${input.courseTitle} in ${loc}`,
    scenes: [
      `${date}${input.session?.start_time ? " · " + input.session.start_time.slice(0, 5) + " Uhr" : ""} · ${loc}`,
      `Für: ${input.audience || "Einsteiger bis Fortgeschrittene"}`,
      input.summary ? input.summary.slice(0, 90) : "Kompakt & praxisnah.",
    ],
    closing: `${cta}. Link im Profil (${input.bookingUrl}).`,
  };
}

export function generateContent(
  input: CourseMarketingInput,
  template: CampaignTemplateKind,
  platforms: Platform[] = ["instagram", "facebook", "tiktok"]
): GeneratedContent[] {
  return platforms.map((platform) => {
    const hashtags = pickHashtags(input, input.organizerBranding);
    const caption = buildCaption(platform, template, input, input.organizerBranding);
    const headlineText = headline(input, template);
    return {
      platform,
      template,
      headline: headlineText,
      caption,
      hashtags,
      cta: defaultCta(input.organizerBranding),
      tiktokScript: platform === "tiktok" ? buildTiktokScript(template, input) : undefined,
    };
  });
}
