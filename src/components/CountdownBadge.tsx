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
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
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

  const { days, hours, minutes, seconds } = formatDuration(diffMs);
  const isLastHour = diffMs <= 60 * 60 * 1000;
  const isLastDay = !isLastHour && diffMs <= 24 * 60 * 60 * 1000;

  const tone = isLastHour
    ? {
        container: "bg-gradient-to-r from-rose-600 to-rose-500 border-rose-700 text-white shadow-[0_8px_24px_-10px_rgba(244,63,94,0.7)]",
        dot: "bg-white",
      }
    : isLastDay
    ? {
        container: "bg-gradient-to-r from-amber-200 via-amber-100 to-white border-amber-200 text-amber-900 shadow-[0_8px_24px_-12px_rgba(251,191,36,0.8)]",
        dot: "bg-amber-600",
      }
    : {
        container: "bg-gradient-to-r from-rose-50 via-white to-white border-rose-100 text-rose-700 shadow-[0_8px_24px_-12px_rgba(244,63,94,0.35)]",
        dot: "bg-rose-500",
      };

  const label =
    days > 0
      ? `Buchung offen: ${days}T · ${hours}Std`
      : hours > 0
        ? `Buchung offen: ${hours}Std · ${minutes}Min`
        : `Buchung offen: ${minutes}Min · ${seconds}Sek`;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold border ${tone.container}`}
      aria-label={label}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${tone.dot} animate-pulse`} aria-hidden />
      <span>{label}</span>
    </div>
  );
}
