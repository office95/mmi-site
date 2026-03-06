"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  startDate: string | null | undefined; // YYYY-MM-DD
  startTime?: string | null; // HH:MM:SS optional
  timezone?: string; // e.g. "Europe/Vienna"
  showThresholdDays?: number; // show when start is within N days
};

function parseDate(date: string, time?: string | null, tz = "Europe/Vienna") {
  if (!date) return null;
  try {
    const iso = time ? `${date}T${time}` : `${date}T00:00:00`;
    // Date without timezone → interpret as local of tz; here: create Date from ISO and adjust by tz offset
    // Simplify: treat as UTC then shift by tz offset at that date
    const d = new Date(iso + "Z");
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = formatter.formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
    const localIso = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
    return new Date(localIso + "Z");
  } catch {
    return null;
  }
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return { days, hours, minutes };
}

export function CountdownBadge({ startDate, startTime, timezone = "Europe/Vienna", showThresholdDays = 7 }: Props) {
  const start = useMemo(() => parseDate(startDate ?? "", startTime, timezone), [startDate, startTime, timezone]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30); // 30s Takt reicht
    return () => clearInterval(id);
  }, []);

  if (!start || isNaN(start.getTime())) return null;
  const diffMs = start.getTime() - now.getTime();
  if (diffMs <= 0) return null;
  const thresholdMs = showThresholdDays * 86400 * 1000;
  if (diffMs > thresholdMs) return null;

  const { days, hours, minutes } = formatDuration(diffMs);
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-[12px] font-semibold text-rose-700 border border-rose-100">
      <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse" aria-hidden />
      <span>Buchung noch {days}d {hours}h {minutes}m möglich</span>
    </div>
  );
}

