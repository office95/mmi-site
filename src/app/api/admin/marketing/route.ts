import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { checkEligibility } from "@/lib/marketing/eligibility";
import { buildCampaignPlan } from "@/lib/marketing/scheduler";
import { generateContent } from "@/lib/marketing/templates";
import { CampaignTemplateKind, CourseMarketingInput, MarketingStatus } from "@/lib/marketing/types";
import { getRegionFromRequest } from "@/lib/region-request";

export const dynamic = "force-dynamic";

const TEMPLATE_BY_DAY = (daysToStart: number, seatsLeft: number | null): CampaignTemplateKind => {
  if (seatsLeft !== null && seatsLeft <= 3) return "last_seats";
  if (daysToStart <= 0) return "enroll_today";
  if (daysToStart <= 3) return "starts_soon";
  if (daysToStart <= 10) return "starts_soon";
  if (daysToStart <= 21) return "new_course";
  return "new_course";
};

export async function GET(req: NextRequest) {
  const region = getRegionFromRequest(req);
  const supabase = getSupabaseServiceClient();

  // Kurse mit relevanten Feldern
  const { data: courses, error: courseErr } = await supabase
    .from("courses")
    .select(
      "id,slug,title,summary,audience,tags,hero_image_url,created_at,type_id,region,sessions(id,start_date,start_time,city,state,price_cents,seats_taken,max_participants,partner_id)"
    )
    .or(`region.eq.${region},region.eq.${region.toLowerCase()},region.ilike.%${region}%,region.is.null,region.eq.,region.eq.%20`);
  if (courseErr) return NextResponse.json({ error: courseErr.message }, { status: 500 });

  // Course Types (für Typnamen)
  const typeIds = Array.from(new Set((courses ?? []).map((c) => c.type_id).filter(Boolean)));
  const { data: typeRows } = typeIds.length
    ? await supabase.from("course_types").select("id,name").in("id", typeIds)
    : { data: [] as any[] };
  const typeMap = new Map((typeRows ?? []).map((t: any) => [t.id, t.name]));

  // Partner laden
  const partnerIds = Array.from(
    new Set(
      (courses ?? [])
        .flatMap((c) => (c.sessions ?? []).map((s: any) => s.partner_id))
        .filter(Boolean)
    )
  );
  const { data: partners } = partnerIds.length
    ? await supabase.from("partners").select("id,name,city,state,country,logo_path").in("id", partnerIds)
    : { data: [] as any[] };
  const partnerMap = new Map((partners ?? []).map((p: any) => [p.id, p]));

  // Bestehende Kampagnen (falls Tabelle bereits migriert)
  let campaignMap = new Map<string, any>();
  try {
    const { data: campaignRows } = await supabase
      .from("marketing_campaigns")
      .select("id,course_id,session_id,status,template,platforms,scheduled_at,approved_at,approved_by,content,updated_at");
    campaignMap = new Map((campaignRows ?? []).map((c: any) => [c.course_id, c]));
  } catch (e) {
    campaignMap = new Map();
  }

  const now = new Date();

  const payload = await Promise.all(
    (courses ?? []).map(async (course: any) => {
      const sessions = (course.sessions ?? []).filter((s: any) => s.start_date) as any[];
      const sortedSessions = sessions.sort((a, b) => (a.start_date > b.start_date ? 1 : -1));
      const chosenSession = sortedSessions[0] ?? null;
      const partner = chosenSession?.partner_id ? partnerMap.get(chosenSession.partner_id) || null : null;
      const seatsLeft = chosenSession?.max_participants ? (chosenSession.max_participants ?? 0) - (chosenSession.seats_taken ?? 0) : null;
    const input: CourseMarketingInput = {
      courseId: course.id,
      courseSlug: course.slug,
      courseTitle: course.title,
      summary: course.summary,
      audience: course.audience,
      tags: course.tags ?? [],
      image: course.hero_image_url,
      createdAt: course.created_at,
      typeName: course.type_id ? typeMap.get(course.type_id) : null,
      partner: partner ? { id: partner.id, name: partner.name, city: partner.city, state: partner.state } : null,
      session: chosenSession
        ? {
            id: chosenSession.id,
            start_date: chosenSession.start_date,
            start_time: chosenSession.start_time,
            city: chosenSession.city,
            state: chosenSession.state,
            price_cents: chosenSession.price_cents,
            seats_taken: chosenSession.seats_taken,
            max_participants: chosenSession.max_participants,
          }
        : null,
      bookingUrl: course.slug
        ? `${process.env.NEXT_PUBLIC_SITE_URL || "https://musicmission.at"}/kurs/${course.slug}${chosenSession ? `?booking=${chosenSession.id}` : ""}`
        : undefined,
      organizerBranding: partner
        ? {
            logo: partner.logo_path,
            primaryColor: null,
            secondaryColor: null,
            tone: null,
            defaultCta: null,
            defaultHashtags: null,
          }
        : null,
    };

    const eligibility = checkEligibility(input);
    let status: MarketingStatus = eligibility.eligible ? "eligible" : "not_eligible";
    const plan = eligibility.eligible ? buildCampaignPlan(input) : [];
    const daysToStart = input.session?.start_date
      ? Math.floor((new Date(input.session.start_date + "T00:00:00").getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;
    const template = eligibility.eligible ? TEMPLATE_BY_DAY(daysToStart, seatsLeft) : null;
    const content = template ? generateContent(input, template) : [];
    if (content.length) status = "generated";

    const nextEvent = plan.find((p) => new Date(p.at) > now);
    if (nextEvent && status === "generated") status = "scheduled";

    const existing = campaignMap.get(course.id);
    const campaignId = existing?.id ?? null;
    const persistedStatus = existing?.status as MarketingStatus | undefined;
    if (persistedStatus === "paused" || persistedStatus === "published" || persistedStatus === "needs_approval") {
      status = persistedStatus;
    }

    const platforms = Array.from(new Set(content.map((c) => c.platform)));

    try {
      await supabase.from("marketing_campaigns").upsert(
        {
          id: campaignId ?? undefined,
          course_id: course.id,
          session_id: chosenSession?.id ?? null,
          partner_id: partner?.id ?? null,
          status,
          template,
          platforms,
          scheduled_at: nextEvent?.at ?? null,
          content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (e) {
      /* ignore if table missing */
    }

    return {
      campaignId,
      courseId: course.id,
      courseTitle: course.title,
      courseSlug: course.slug,
      image: course.hero_image_url ?? null,
      status,
      persistedStatus: persistedStatus ?? null,
      eligibility,
      session: input.session,
      sessions: sortedSessions.map((s) => ({
        id: s.id,
        start_date: s.start_date,
        start_time: s.start_time,
        city: s.city,
        state: s.state,
        partner: s.partner_id ? partnerMap.get(s.partner_id) || null : null,
      })),
      partner,
      branding: input.organizerBranding,
      plan,
      template,
      content,
    };
  })
  );

  return NextResponse.json({ data: payload });
}
