import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompetencyBar } from "@/components/domain/competency-bar";
import { HandwritingSample } from "@/components/domain/handwriting-sample";
import { PageHeader } from "@/components/domain/page-header";
import { StatCard } from "@/components/domain/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MASTERY_THRESHOLD } from "@/lib/domain";
import { formatPercent } from "@/lib/format";
import { getWeeklyReport } from "@/lib/mock/report";

export default async function WeeklyReportPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  const report = getWeeklyReport(week);
  if (!report) notFound();

  return (
    <section className="space-y-8">
      <Link
        href="/ortu/laporan"
        className="inline-flex min-h-touch items-center gap-2 rounded-lg text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Semua laporan
      </Link>

      <PageHeader
        eyebrow={`Laporan mingguan · ${report.studentName}`}
        title={report.weekLabel}
        description={report.narrative}
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/ortu/bantuan" />}>
              Tanya tentang laporan
            </Button>
            <Button nativeButton={false} render={<Link href="/ortu/langganan" />}>
              Kelola langganan
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {report.stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Kemajuan per kompetensi</CardTitle>
            <CardDescription>
              Garis hitam menandai ambang tuntas {formatPercent(MASTERY_THRESHOLD)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {report.competencies.map((competency) => (
              <CompetencyBar key={competency.code} {...competency} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Yang perlu perhatian</CardTitle>
            <CardDescription>Hal kecil yang bisa dibantu di rumah.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {report.attention.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
                  <div className="space-y-1">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-muted-foreground">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Contoh coretan</CardTitle>
          <CardDescription>Cara {report.studentName} mengerjakan salah satu soal.</CardDescription>
        </CardHeader>
        <CardContent>
          <HandwritingSample {...report.sampleInk} className="max-w-xl" />
        </CardContent>
      </Card>

      <section aria-labelledby="rencana" className="space-y-4">
        <h2 id="rencana" className="font-heading text-xl font-semibold">
          Rencana 2 minggu
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {report.plan.map((step) => (
            <Card key={step.title}>
              <CardHeader>
                <CardTitle className="font-heading text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-5">
                  {step.goals.map((goal) => (
                    <li key={goal}>{goal}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </section>
  );
}
