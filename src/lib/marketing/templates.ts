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

const defaultCta = (branding?: Branding | null) => branding?.defaultCta || "Jetzt Platz sichern";

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
      return `${title} startet am ${date}`;
    case "last_seats":
      return `Letzte Plätze: ${title}`;
    case "new_date":
      return `Neuer Termin in ${loc}`;
    case "enroll_today":
      return `${title}: heute anmelden`;
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
    instagram: (body: string) => `${body}\n\n${cta} → ${input.bookingUrl}`,
    facebook: (body: string) => `${body}\n\n${cta}: ${input.bookingUrl}`,
    tiktok: (body: string) => `${body} · ${cta} (${input.bookingUrl})`,
  }[platform];

  const body = (() => {
    switch (tpl) {
      case "new_course":
        return `${input.courseTitle}: ${input.summary || "Jetzt entdecken"}. ${partner ? partner + " · " : ""}${loc}. ${price}`.trim();
      case "starts_soon":
        return `${input.courseTitle} startet am ${date} ${partner ? "· " + partner : ""}. ${loc}${price ? " · " + price : ""}`.trim();
      case "last_seats":
        return `Wenige Plätze für ${input.courseTitle} am ${date}. ${loc}${price ? " · " + price : ""}`.trim();
      case "new_date":
        return `Neuer Termin für ${input.courseTitle}: ${date} in ${loc}.`;
      case "enroll_today":
        return `Melde dich heute für ${input.courseTitle} an – ${loc}${price ? " · " + price : ""}.`;
      case "partner_spotlight":
        return `${input.partner?.name ?? "Unser Partner"} hostet ${input.courseTitle} in ${loc}. ${input.summary || "Kursdetails im Link"}`.trim();
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
    hook: tpl === "last_seats" ? `Noch ${Math.max(1, (input.session?.max_participants ?? 0) - (input.session?.seats_taken ?? 0) || 1)} Plätze?` : `${input.courseTitle} in ${loc}`,
    scenes: [
      `Was erwartet dich: ${input.summary || "Praxisnaher Kurs"}`,
      `Wann/wo: ${date} · ${loc}${input.partner?.name ? " · " + input.partner.name : ""}`,
      `Für wen: ${input.audience || "ambitionierte Musiker:innen"}`,
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

