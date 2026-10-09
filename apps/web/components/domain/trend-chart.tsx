import Link from "next/link";

import type { WeeklyTrendPoint } from "@/lib/domain";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TrendChartProps {
  points: readonly WeeklyTrendPoint[];
  /** Weeks that have a report, mapped to its URL; other weeks are shown without a link. */
  hrefs?: Readonly<Record<string, string>>;
  className?: string;
}

/** Weekly accuracy as horizontal bars; the exact numbers are printed so nothing relies on length. */
export function TrendChart({ points, hrefs = {}, className }: TrendChartProps) {
  const latest = points.at(-1)?.weekId;

  return (
    <ol className={cn("space-y-1", className)}>
      {points.map((point) => {
        const href = hrefs[point.weekId];
        const row = (
          <>
            <span className="w-28 shrink-0 text-sm text-muted-foreground">{point.label}</span>
            <span
              role="meter"
              aria-label={`Akurasi ${point.label}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(point.accuracy * 100)}
              className="relative h-3 min-w-0 flex-1 rounded-full bg-muted"
            >
              <span
                className={cn(
                  "block h-full rounded-full",
                  point.weekId === latest ? "bg-primary" : "bg-primary/45",
                )}
                style={{ width: `${point.accuracy * 100}%` }}
              />
            </span>
            <span className="w-24 shrink-0 text-right text-sm tabular-nums">
              <span className="font-semibold">{formatPercent(point.accuracy)}</span>
              <span className="text-muted-foreground"> · {point.itemsDone} soal</span>
            </span>
          </>
        );

        return (
          <li key={point.weekId}>
            {href ? (
              <Link
                href={href}
                className="flex min-h-touch items-center gap-3 rounded-lg px-2 transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
              >
                {row}
                <span className="sr-only">, buka laporan</span>
              </Link>
            ) : (
              <div className="flex min-h-touch items-center gap-3 px-2">{row}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
