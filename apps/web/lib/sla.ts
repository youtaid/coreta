import type { HintReport, HintReportStatus } from "@/lib/domain";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** Hint reports must be reviewed within 24 hours of being filed. */
export const SLA_HOURS = 24;

/** The countdown turns red once less than this much time is left. */
export const URGENT_BELOW_HOURS = 4;

export type SlaLevel = "ok" | "urgent" | "overdue";

export function slaLevel(remainingMs: number): SlaLevel {
  if (remainingMs <= 0) return "overdue";
  return remainingMs < URGENT_BELOW_HOURS * HOUR_MS ? "urgent" : "ok";
}

const pad = (value: number) => String(value).padStart(2, "0");

/** 4_980_000 → "01:23:00"; negative values (past the deadline) are shown as their absolute size. */
export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.floor(Math.abs(remainingMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${pad(hours)}:${pad(minutes)}:${pad(totalSeconds % 60)}`;
}

/** Spoken form that changes once a minute, so a screen reader is not interrupted every second. */
export function describeRemaining(remainingMs: number): string {
  const totalMinutes = Math.floor(Math.abs(remainingMs) / MINUTE_MS);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const span = hours > 0 ? `${hours} jam ${minutes} menit` : `${minutes} menit`;
  return remainingMs <= 0 ? `Terlambat ${span}` : `${span} tersisa`;
}

export const hintReportStatusLabels: Record<HintReportStatus, string> = {
  open: "Terbuka",
  valid: "Valid",
  revised: "Direvisi",
  item_flagged: "Butir ditandai",
};

/** Open reports first, soonest deadline first; resolved reports keep their original order. */
export function sortReviewQueue<T extends Pick<HintReport, "status" | "dueInMinutes">>(
  reports: readonly T[],
): T[] {
  const open = reports
    .filter((report) => report.status === "open")
    .sort((a, b) => a.dueInMinutes - b.dueInMinutes);
  const resolved = reports.filter((report) => report.status !== "open");
  return [...open, ...resolved];
}

export function countByStatus(
  reports: readonly Pick<HintReport, "status">[],
): Record<HintReportStatus, number> {
  const counts: Record<HintReportStatus, number> = {
    open: 0,
    valid: 0,
    revised: 0,
    item_flagged: 0,
  };
  for (const report of reports) counts[report.status] += 1;
  return counts;
}
