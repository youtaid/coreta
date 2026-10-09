import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { DailyTargetCard } from "@/components/domain/daily-target-card";
import { PageHeader } from "@/components/domain/page-header";
import { PathMap } from "@/components/domain/path-map";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { countMastered, findCurrentStage, goalStreak } from "@/lib/learning-path";
import {
  TODAY,
  dailyGoal,
  nextWorksheet,
  pathActivity,
  pathStages,
  todayCount,
} from "@/lib/mock/path";

const WORKSHEET_HREF = "/belajar/worksheet";

export default function LearningPathPage() {
  const current = findCurrentStage(pathStages);
  const mastered = countMastered(pathStages);
  const streak = goalStreak(pathActivity, dailyGoal, TODAY);

  // A plain link styled as a button: it navigates, so assistive tech should announce a link.
  const continueButton = (
    <Link href={WORKSHEET_HREF} className={buttonVariants({ size: "lg", className: "w-fit" })}>
      Lanjut belajar
      <ArrowRight data-icon="inline-end" aria-hidden />
    </Link>
  );

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Siswa"
        title="Jalur belajar"
        description={`${mastered} dari ${pathStages.length} tahap tuntas. Tahap berikutnya terbuka setelah semua kompetensi di tahap aktif mencapai 80%.`}
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="border-primary/30">
          <CardHeader>
            <CardDescription>Sedang dipelajari</CardDescription>
            <CardTitle className="font-heading text-2xl">
              {current ? `Tahap ${current.number} · ${current.name}` : "Semua tahap tuntas"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {current && (
              <Progress value={Math.round(current.progress * 100)}>
                <ProgressLabel>Kompetensi tuntas</ProgressLabel>
                <ProgressValue />
              </Progress>
            )}
            {nextWorksheet && (
              <p className="text-muted-foreground">
                Berikutnya:{" "}
                <span className="font-medium text-foreground">{nextWorksheet.title}</span>
                {nextWorksheet.answeredCount > 0
                  ? ` · ${nextWorksheet.answeredCount} dari ${nextWorksheet.itemCount} soal terjawab`
                  : ` · ${nextWorksheet.itemCount} soal`}
              </p>
            )}
            {continueButton}
          </CardContent>
        </Card>

        <DailyTargetCard done={todayCount} goal={dailyGoal} streak={streak} />
      </div>

      <section aria-labelledby="peta-tahap" className="space-y-4">
        <h2 id="peta-tahap" className="font-heading text-xl font-semibold">
          Peta tahap
        </h2>
        <PathMap
          stages={pathStages}
          stageHref={(stage) => `${WORKSHEET_HREF}?tahap=${stage.number}`}
        />
      </section>
    </section>
  );
}
