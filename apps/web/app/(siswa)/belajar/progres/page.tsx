import Link from "next/link";

import { ActivityCalendar } from "@/components/domain/activity-calendar";
import { CompetencyBar } from "@/components/domain/competency-bar";
import { PageHeader } from "@/components/domain/page-header";
import { StatCard } from "@/components/domain/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { MASTERY_THRESHOLD } from "@/lib/domain";
import { competencies, stages, weeklyStats } from "@/lib/mock/learning";
import { DAILY_GOAL, dailyActivity } from "@/lib/mock/progress";

export default function StudentProgressPage() {
  const activeStage = stages.find((stage) => stage.status === "active");

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Siswa"
        title="Progres"
        description="Lihat kompetensi yang sudah kamu kuasai dan seberapa rutin kamu berlatih."
        actions={
          <Button nativeButton={false} render={<Link href="/belajar/worksheet" />}>
            Buka worksheet
          </Button>
        }
      />

      <section aria-labelledby="ringkasan" className="space-y-4">
        <h2 id="ringkasan" className="font-heading text-xl font-semibold">
          7 hari terakhir
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {weeklyStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Kompetensi</CardTitle>
            <CardDescription>
              {activeStage ? `Tahap ${activeStage.number} · ${activeStage.name}. ` : ""}
              Garis hitam menandai ambang tuntas {formatPercent(MASTERY_THRESHOLD)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {competencies.map((competency) => (
              <CompetencyBar key={competency.code} {...competency} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Kalender aktivitas</CardTitle>
            <CardDescription>
              Lima minggu terakhir. Target harian: {DAILY_GOAL} soal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityCalendar days={dailyActivity} goal={DAILY_GOAL} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
