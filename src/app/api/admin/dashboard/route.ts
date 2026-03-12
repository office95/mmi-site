import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

type PeriodKey = "today" | "week" | "month" | "year";

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

async function loadStats(from: Date, to: Date) {
  const supabase = getSupabaseServiceClient();
  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  // Orders
  const { data: orders } = await supabase
    .from("orders")
    .select("status, amount_cents")
    .gte("created_at", fromIso)
    .lte("created_at", toIso);

  const orderStats = {
    total: orders?.length ?? 0,
    paid: orders?.filter((o) => o.status === "paid").length ?? 0,
    pending: orders?.filter((o) => o.status === "pending").length ?? 0,
    canceled: orders?.filter((o) => o.status === "canceled").length ?? 0,
    revenue_cents_paid: orders
      ?.filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + (o.amount_cents ?? 0), 0) ?? 0,
  };

  // Automation logs
  const { data: autoLogs } = await supabase
    .from("automation_logs")
    .select("status")
    .gte("sent_at", fromIso)
    .lte("sent_at", toIso);
  const automationStats = {
    sent: autoLogs?.length ?? 0,
    errors: autoLogs?.filter((l) => l.status === "error").length ?? 0,
  };

  // Diploma applications
  const { count: diplomaCount } = await supabase
    .from("diploma_applications")
    .select("*", { count: "exact", head: true })
    .gte("created_at", fromIso)
    .lte("created_at", toIso);

  // Form submissions
  const { count: formCount } = await supabase
    .from("form_submissions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", fromIso)
    .lte("created_at", toIso);

  return {
    orders: orderStats,
    automations: automationStats,
    diploma_applications: diplomaCount ?? 0,
    form_submissions: formCount ?? 0,
  };
}

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const periods: Record<PeriodKey, any> = {} as any;
  for (const key of ["today", "week", "month", "year"] as PeriodKey[]) {
    const from = periodStarts[key]();
    periods[key] = await loadStats(from, now);
  }
  return NextResponse.json({ periods });
}
