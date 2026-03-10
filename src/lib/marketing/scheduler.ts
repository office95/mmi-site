import { CampaignPlanItem, CampaignTemplateKind, CourseMarketingInput } from "./types";

const daysBefore = (startDate?: string | null, days = 0) => {
  if (!startDate) return null;
  const d = new Date(startDate + "T00:00:00");
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

export function buildCampaignPlan(course: CourseMarketingInput): CampaignPlanItem[] {
  const start = course.session?.start_date;
  if (!start) return [];

  const slots: { days: number; label: string; template: CampaignTemplateKind; platforms: CampaignPlanItem["platform"] }[] = [
    { days: 21, label: "Awareness", template: "new_course", platforms: ["instagram", "facebook"] },
    { days: 10, label: "Reminder", template: "starts_soon", platforms: ["instagram", "facebook", "tiktok"] },
    { days: 3, label: "Letzte Plätze", template: "last_seats", platforms: ["instagram", "tiktok"] },
    { days: 0, label: "Start", template: "enroll_today", platforms: ["instagram", "tiktok"] },
  ];

  return slots
    .map((slot) => {
      const at = daysBefore(start, slot.days);
      if (!at) return null;
      return { at, label: slot.label, template: slot.template, platform: slot.platforms } as CampaignPlanItem;
    })
    .filter(Boolean) as CampaignPlanItem[];
}

