export type MarketingStatus =
  | "not_eligible"
  | "eligible"
  | "generated"
  | "needs_approval"
  | "scheduled"
  | "published"
  | "paused";

export type Platform = "instagram" | "facebook" | "tiktok";

export type CampaignTemplateKind =
  | "new_course"
  | "starts_soon"
  | "last_seats"
  | "new_date"
  | "enroll_today"
  | "partner_spotlight";

export type Branding = {
  logo?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  tone?: string | null;
  defaultCta?: string | null;
  defaultHashtags?: string[] | null;
};

export type CourseMarketingInput = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  summary?: string | null;
  audience?: string | null;
  tags?: string[];
  image?: string | null;
  createdAt?: string | null;
  typeName?: string | null;
  partner?: { id: string; name?: string | null; city?: string | null; state?: string | null } | null;
  session?: {
    id: string;
    start_date?: string | null;
    start_time?: string | null;
    city?: string | null;
    state?: string | null;
    price_cents?: number | null;
    seats_taken?: number | null;
    max_participants?: number | null;
  } | null;
  bookingUrl?: string;
  organizerBranding?: Branding | null;
};

export type EligibilityResult = {
  eligible: boolean;
  missing: string[];
};

export type GeneratedContent = {
  platform: Platform;
  template: CampaignTemplateKind;
  headline: string;
  caption: string;
  hashtags: string[];
  cta: string;
  tiktokScript?: {
    hook: string;
    scenes: string[];
    closing: string;
  };
};

export type CampaignPlanItem = {
  at: string; // ISO date-time planned
  label: string;
  platform: Platform[];
  template: CampaignTemplateKind;
};

