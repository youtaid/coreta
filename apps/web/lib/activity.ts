import type { ActivityDay } from "@/lib/domain";

export type ActivityLevel = "future" | "none" | "low" | "mid" | "goal";

export interface ActivityCell extends ActivityDay {
  level: ActivityLevel;
  goalMet: boolean;
}

/** Share of the daily goal reached; the "mid" band starts at half of it. */
export function activityLevel(count: number | undefined, goal: number): ActivityLevel {
  if (count === undefined) return "future";
  if (count >= goal) return "goal";
  if (count >= goal / 2) return "mid";
  return count > 0 ? "low" : "none";
}

// Dates are parsed as UTC so the weekday never shifts with the viewer's time zone.
function mondayFirstWeekday(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/** Groups consecutive days into Monday-first weeks; the first and last week may be partial. */
export function groupByWeek(days: readonly ActivityDay[], goal: number): ActivityCell[][] {
  const weeks: ActivityCell[][] = [];
  for (const day of days) {
    const cell: ActivityCell = {
      ...day,
      level: activityLevel(day.count, goal),
      goalMet: day.count !== undefined && day.count >= goal,
    };
    if (weeks.length === 0 || mondayFirstWeekday(day.date) === 0) weeks.push([]);
    weeks[weeks.length - 1]?.push(cell);
  }
  return weeks;
}

const dayMonthFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** "2026-10-07" → "7 Oktober". */
export function formatDayMonth(date: string): string {
  return dayMonthFormat.format(new Date(`${date}T00:00:00Z`));
}

export function countGoalDays(days: readonly ActivityDay[], goal: number): number {
  return days.filter((day) => day.count !== undefined && day.count >= goal).length;
}
