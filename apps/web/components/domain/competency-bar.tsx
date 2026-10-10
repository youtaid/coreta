import { CircleCheck } from "lucide-react";

import { type CompetencyMastery, MASTERY_THRESHOLD } from "@/lib/domain";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type CompetencyBarProps = CompetencyMastery & {
  threshold?: number;
  className?: string;
};

/** Mastery bar with a marker at the mastery threshold (TIP: "KompetensiBar"). */
export function CompetencyBar({
  code,
  name,
  score,
  threshold = MASTERY_THRESHOLD,
  className,
}: CompetencyBarProps) {
  const mastered = score >= threshold;
  const percent = Math.round(Math.min(Math.max(score, 0), 1) * 100);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 font-medium">
          <span className="mr-2 text-sm text-muted-foreground tabular-nums">{code}</span>
          {name}
        </p>
        <p
          className={cn(
            "flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums",
            mastered ? "text-success" : "text-muted-foreground",
          )}
        >
          {mastered && <CircleCheck className="size-4" aria-hidden />}
          {formatPercent(score)}
          {mastered && <span className="sr-only">, tuntas</span>}
        </p>
      </div>
      <div
        role="meter"
        aria-label={`Penguasaan ${name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%, ambang tuntas ${formatPercent(threshold)}`}
        className="relative h-3 rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full", mastered ? "bg-success" : "bg-primary")}
          style={{ width: `${percent}%` }}
        />
        <div
          className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground"
          style={{ left: `${threshold * 100}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
