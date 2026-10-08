import { Clock, ListChecks } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { WorksheetStatus, WorksheetSummary } from "@/lib/domain";
import { formatPercent } from "@/lib/format";

type WorksheetCardProps = WorksheetSummary & {
  /** Where the main button goes (workspace or result page). */
  href: string;
  className?: string;
};

const statusMeta: Record<
  WorksheetStatus,
  { badge: string; variant: "default" | "secondary" | "warning" | "success"; cta: string }
> = {
  new: { badge: "Baru", variant: "default", cta: "Mulai" },
  in_progress: { badge: "Sedang dikerjakan", variant: "secondary", cta: "Lanjutkan" },
  review: { badge: "Ulang berjarak", variant: "warning", cta: "Ulangi" },
  completed: { badge: "Selesai", variant: "success", cta: "Lihat hasil" },
};

export function WorksheetCard({
  title,
  stageName,
  itemCount,
  answeredCount,
  estimatedMinutes,
  status,
  score,
  dueLabel,
  href,
  className,
}: WorksheetCardProps) {
  const meta = statusMeta[status];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{stageName}</CardDescription>
        <CardAction>
          <Badge variant={meta.variant}>{meta.badge}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ListChecks className="size-4" aria-hidden />
            {itemCount} soal
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden />±{estimatedMinutes} menit
          </span>
          {dueLabel && <span>{dueLabel}</span>}
        </p>
        {status === "in_progress" && (
          <Progress value={(answeredCount / itemCount) * 100} aria-label="Soal terjawab">
            <span className="text-sm text-muted-foreground">
              {answeredCount} dari {itemCount} soal terjawab
            </span>
          </Progress>
        )}
        {status === "completed" && score !== undefined && (
          <p className="text-sm">
            Skor <span className="text-lg font-bold tabular-nums">{formatPercent(score)}</span>
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={status === "completed" ? "outline" : "default"}
          nativeButton={false}
          render={<Link href={href} />}
        >
          {meta.cta}
        </Button>
      </CardFooter>
    </Card>
  );
}
