import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { StatSummary } from "@/lib/domain";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type StatCardProps = StatSummary & { className?: string };

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  higherIsBetter = true,
  className,
}: StatCardProps) {
  const direction = change === undefined ? null : change > 0 ? "up" : change < 0 ? "down" : "flat";
  const isGood = direction === "flat" ? null : (direction === "up") === higherIsBetter;
  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;

  return (
    <Card className={className}>
      <CardContent className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-heading text-3xl font-bold tracking-tight tabular-nums">{value}</p>
        {direction && change !== undefined && (
          <p
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              isGood === true && "text-success",
              isGood === false && "text-destructive",
              isGood === null && "text-muted-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span>
              {change > 0 ? "+" : change < 0 ? "−" : ""}
              {formatPercent(Math.abs(change))}
            </span>
            {changeLabel && (
              <span className="font-normal text-muted-foreground">{changeLabel}</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
