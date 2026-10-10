import { Flame, Target } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { dailyTargetProgress } from "@/lib/learning-path";
import { cn } from "@/lib/utils";

interface DailyTargetCardProps {
  /** Items answered today. */
  done: number;
  /** Items per day that count as reaching the target. */
  goal: number;
  /** Consecutive days with the target reached, including today when reached. */
  streak: number;
  className?: string;
}

export function DailyTargetCard({ done, goal, streak, className }: DailyTargetCardProps) {
  const target = dailyTargetProgress(done, goal);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-lg">
          <Target className="size-5 text-primary" aria-hidden />
          Target hari ini
        </CardTitle>
        <CardDescription>
          {target.reached
            ? "Target tercapai. Soal tambahan tetap dihitung untuk progresmu."
            : `Tinggal ${target.remaining} soal lagi untuk mencapai target.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={Math.round(target.ratio * 100)}>
          <ProgressLabel className="w-full text-base">
            <span className="text-3xl font-bold tabular-nums">{target.done}</span>
            <span className="text-muted-foreground"> / {target.goal} soal</span>
          </ProgressLabel>
        </Progress>
        <p
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            streak > 0 ? "text-warning" : "text-muted-foreground",
          )}
        >
          <Flame className="size-4 shrink-0" aria-hidden />
          {streak > 0
            ? `${streak} hari beruntun mencapai target`
            : "Capai target hari ini untuk memulai rangkaian"}
        </p>
      </CardContent>
    </Card>
  );
}
