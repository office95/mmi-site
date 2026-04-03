import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

type PeriodKey = "today" | "week" | "month" | "year";
type PeriodStats = {
  orders: { total: number; paid: number; pending: number; canceled: number; revenue_cents_paid: number };
  automations: { sent: number; errors: number };
  diploma_applications: number;
  form_submissions: number;
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfWeek() {
  const d = startOfToday();
  const day = d.getDay(); // 0=So
  const diff = (day === 0 ? -6 : 1 - day); // Montag als Wochenstart
  d.setDate(d.getDate() + diff);
  return d;
}
function startOfMonth() {
  const d = startOfToday();
  d.setDate(1);
  return d;
}
function startOfYear() {
  const d = startOfToday();
  d.setMonth(0, 1);
  return d;
}

const periodStarts: Record<PeriodKey, () => Date> = {
  today: startOfToday,
  week: startOfWeek,
  month: startOfMonth,
  year: startOfYear,
};

const parseDateOnly = (isoDate: string) => new Date(`${isoDate}T00:00:00`);

function daysUntil(isoDate: string) {
  const start = parseDateOnly(isoDate).getTime();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((start - now.getTime()) / (1000 * 60 * 60 * 24));
}

function emptyPeriodStats(): PeriodStats {
  return {
    orders: { total: 0, paid: 0, pending: 0, canceled: 0, revenue_cents_paid: 0 },
    automations: { sent: 0, errors: 0 },
    diploma_applications: 0,
    form_submissions: 0,
  };
}

async function loadAllPeriodStats(now: Date) {
  const supabase = getSupabaseServiceClient();
  const toIso = now.toISOString();
  const toMs = now.getTime();
  const periodsList = (["today", "week", "month", "year"] as PeriodKey[]).map((key) => ({
    key,
    fromMs: periodStarts[key]().getTime(),
  }));
  const fromIso = new Date(Math.min(...periodsList.map((item) => item.fromMs))).toISOString();

  const [ordersRes, logsRes, diplomaRes, formRes] = await Promise.all([
    supabase.from("orders").select("status, amount_cents, created_at").gte("created_at", fromIso).lte("created_at", toIso),
    supabase.from("automation_logs").select("status, sent_at").gte("sent_at", fromIso).lte("sent_at", toIso),
    supabase.from("diploma_applications").select("created_at").gte("created_at", fromIso).lte("created_at", toIso),
    supabase.from("form_submissions").select("created_at").gte("created_at", fromIso).lte("created_at", toIso),
  ]);

  const periods = {
    today: emptyPeriodStats(),
    week: emptyPeriodStats(),
    month: emptyPeriodStats(),
    year: emptyPeriodStats(),
  } as Record<PeriodKey, PeriodStats>;

  const inRangeForPeriod = (ms: number, period: PeriodKey) =>
    Number.isFinite(ms) && ms >= periodsList.find((item) => item.key === period)!.fromMs && ms <= toMs;

  for (const row of ordersRes.data ?? []) {
    const ms = Date.parse(row.created_at ?? "");
    for (const period of ["today", "week", "month", "year"] as PeriodKey[]) {
      if (!inRangeForPeriod(ms, period)) continue;
      periods[period].orders.total += 1;
      if (row.status === "paid") {
        periods[period].orders.paid += 1;
        periods[period].orders.revenue_cents_paid += row.amount_cents ?? 0;
      } else if (row.status === "pending") {
        periods[period].orders.pending += 1;
      } else if (row.status === "canceled") {
        periods[period].orders.canceled += 1;
      }
    }
  }

  for (const row of logsRes.data ?? []) {
    const ms = Date.parse(row.sent_at ?? "");
    for (const period of ["today", "week", "month", "year"] as PeriodKey[]) {
      if (!inRangeForPeriod(ms, period)) continue;
      periods[period].automations.sent += 1;
      if (row.status === "error") periods[period].automations.errors += 1;
    }
  }

  for (const row of diplomaRes.data ?? []) {
    const ms = Date.parse(row.created_at ?? "");
    for (const period of ["today", "week", "month", "year"] as PeriodKey[]) {
      if (inRangeForPeriod(ms, period)) periods[period].diploma_applications += 1;
    }
  }

  for (const row of formRes.data ?? []) {
    const ms = Date.parse(row.created_at ?? "");
    for (const period of ["today", "week", "month", "year"] as PeriodKey[]) {
      if (inRangeForPeriod(ms, period)) periods[period].form_submissions += 1;
    }
  }

  return periods;
}

async function loadMissingFollowUps() {
  const supabase = getSupabaseServiceClient();
  const limit = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const limitIso = limit.toISOString().slice(0, 10);
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("course_id,start_date")
    .not("course_id", "is", null)
    .not("start_date", "is", null)
    .lte("start_date", limitIso);

  if (sessionsError || !sessions?.length) {
    return { missing_followups_count: 0, missing_followups: [] as { course_id: string; title: string; start_date: string; days_until: number }[] };
  }

  const latestStartByCourse = new Map<string, string>();
  for (const row of sessions as { course_id: string; start_date: string }[]) {
    const existing = latestStartByCourse.get(row.course_id);
    if (!existing || row.start_date > existing) latestStartByCourse.set(row.course_id, row.start_date);
  }

  const candidateCourseIds = Array.from(latestStartByCourse.keys());
  if (!candidateCourseIds.length) return { missing_followups_count: 0, missing_followups: [] as { course_id: string; title: string; start_date: string; days_until: number }[] };

  const { data: courses } = await supabase.from("courses").select("id,title").in("id", candidateCourseIds);

  // source_course_id may not exist before migration; fallback gracefully
  let successorSourceIds = new Set<string>();
  const { data: linkRows, error: linkError } = await supabase
    .from("courses")
    .select("source_course_id")
    .not("source_course_id", "is", null);
  if (!linkError && linkRows?.length) {
    successorSourceIds = new Set((linkRows as { source_course_id: string | null }[]).map((r) => r.source_course_id).filter(Boolean) as string[]);
  }

  const alerts = (courses ?? [])
    .map((course) => {
      const startDate = latestStartByCourse.get(course.id);
      if (!startDate) return null;
      if (successorSourceIds.has(course.id)) return null;
      return {
        course_id: course.id,
        title: course.title ?? "Kurs",
        start_date: startDate,
        days_until: daysUntil(startDate),
      };
    })
    .filter((entry): entry is { course_id: string; title: string; start_date: string; days_until: number } => Boolean(entry))
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  return {
    missing_followups_count: alerts.length,
    missing_followups: alerts.slice(0, 8),
  };
}

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const supabase = getSupabaseServiceClient();
  const [periods, alerts, liveCoursesRes] = await Promise.all([
    loadAllPeriodStats(now),
    loadMissingFollowUps(),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);
  return NextResponse.json({
    periods,
    alerts,
    live_courses_count: liveCoursesRes.count ?? 0,
  });
}
