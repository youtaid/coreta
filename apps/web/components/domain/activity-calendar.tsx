import { Check } from "lucide-react";

import { type ActivityCell, type ActivityLevel, groupByWeek, formatDayMonth } from "@/lib/activity";
import type { ActivityDay } from "@/lib/domain";
import { cn } from "@/lib/utils";

interface ActivityCalendarProps {
  days: readonly ActivityDay[];
  /** Items per day that count as reaching the target. */
  goal: number;
  className?: string;
}

const weekdayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const levelClass: Record<ActivityLevel, string> = {
  goal: "bg-success text-success-foreground",
  mid: "bg-success/30 text-foreground",
  low: "bg-success/15 text-foreground",
  none: "bg-muted text-muted-foreground",
  future: "border border-dashed border-border text-muted-foreground/60",
};

function describeCell(cell: ActivityCell): string {
  const date = formatDayMonth(cell.date);
  if (cell.count === undefined) return `${date}: belum terjadi`;
  const result = cell.goalMet ? "target tercapai" : "target belum tercapai";
  return `${date}: ${cell.count} soal, ${result}`;
}

/** Daily activity as Monday-first weeks; a day reaching the goal is marked with a check. */
export function ActivityCalendar({ days, goal, className }: ActivityCalendarProps) {
  const weeks = groupByWeek(days, goal);

  return (
    <div className={cn("space-y-3", className)}>
      <table className="w-full max-w-md border-separate border-spacing-1.5 text-center">
        <caption className="sr-only">
          Aktivitas harian. Target {goal} soal per hari ditandai dengan centang.
        </caption>
        <thead>
          <tr>
            {weekdayLabels.map((label) => (
              <th key={label} scope="col" className="text-xs font-medium text-muted-foreground">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]?.date}>
              {week.map((cell) => (
                <td
                  key={cell.date}
                  aria-label={describeCell(cell)}
                  className={cn(
                    "aspect-square min-h-touch rounded-lg text-sm font-medium tabular-nums",
                    levelClass[cell.level],
                  )}
                >
                  {cell.goalMet ? (
                    <Check className="mx-auto size-5" aria-hidden />
                  ) : (
                    Number(cell.date.slice(8))
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden>
        {(
          [
            ["goal", `Target tercapai (≥ ${goal} soal)`],
            ["mid", "Separuh target"],
            ["low", "Sedikit"],
            ["none", "Tidak berlatih"],
          ] as const
        ).map(([level, label]) => (
          <li key={level} className="flex items-center gap-1.5">
            <span className={cn("size-3 rounded-sm", levelClass[level])} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
