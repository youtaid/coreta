import type { ActivityDay } from "@/lib/domain";

/** Items per day that count as reaching the daily target. */
export const DAILY_GOAL = 6;

// Mon 7 Sep – Sun 11 Oct 2026, with data up to Wed 7 Oct. The last seven days (1–7 Oct) match
// weeklyStats in learning.ts: 42 items answered, goal reached on 5 of 7 days.
const counts: Record<string, number> = {
  "2026-09-07": 6,
  "2026-09-08": 7,
  "2026-09-09": 0,
  "2026-09-10": 8,
  "2026-09-11": 6,
  "2026-09-12": 3,
  "2026-09-13": 0,
  "2026-09-14": 6,
  "2026-09-15": 6,
  "2026-09-16": 6,
  "2026-09-17": 0,
  "2026-09-18": 7,
  "2026-09-19": 2,
  "2026-09-20": 6,
  "2026-09-21": 8,
  "2026-09-22": 0,
  "2026-09-23": 6,
  "2026-09-24": 6,
  "2026-09-25": 4,
  "2026-09-26": 0,
  "2026-09-27": 6,
  "2026-09-28": 9,
  "2026-09-29": 6,
  "2026-09-30": 0,
  "2026-10-01": 8,
  "2026-10-02": 9,
  "2026-10-03": 4,
  "2026-10-04": 7,
  "2026-10-05": 0,
  "2026-10-06": 8,
  "2026-10-07": 6,
};

const FIRST_DAY = Date.UTC(2026, 8, 7);
const DAYS_SHOWN = 35;

function isoDate(offset: number): string {
  return new Date(FIRST_DAY + offset * 86_400_000).toISOString().slice(0, 10);
}

export const dailyActivity: ActivityDay[] = Array.from({ length: DAYS_SHOWN }, (_, offset) => {
  const date = isoDate(offset);
  return { date, count: counts[date] };
});
