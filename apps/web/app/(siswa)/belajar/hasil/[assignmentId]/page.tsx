import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/domain/page-header";
import { ResultQuestion } from "@/components/domain/result-question";
import { StatCard } from "@/components/domain/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { countOutcomes, getWorksheetResult } from "@/lib/mock/worksheets";

export default async function WorksheetResultPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const result = getWorksheetResult(assignmentId);
  if (!result) notFound();

  const counts = countOutcomes(result.questions);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow={result.stageName}
        title={result.title}
        description="Hasil worksheet. Buka pembahasan untuk melihat cara penyelesaiannya."
        actions={
          <>
            <Link href="/belajar/worksheet" className={buttonVariants({ variant: "outline" })}>
              Daftar worksheet
            </Link>
            <Link href="/belajar/progres" className={buttonVariants()}>
              Lihat progres
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground">Skor</p>
            <p className="font-heading text-4xl font-bold tracking-tight tabular-nums">
              {formatPercent(result.score)}
            </p>
          </CardContent>
        </Card>
        <StatCard label="Benar" value={String(counts.correct)} />
        <StatCard label="Sebagian benar" value={String(counts.partial)} />
        <StatCard label="Salah" value={String(counts.incorrect)} />
        <StatCard label="Waktu" value={`${result.durationMinutes} mnt`} />
      </div>

      <section aria-labelledby="daftar-soal" className="space-y-4">
        <h2 id="daftar-soal" className="font-heading text-xl font-semibold">
          Daftar soal
        </h2>
        <ol className="space-y-4">
          {result.questions.map((question) => (
            <li key={question.number}>
              <ResultQuestion {...question} />
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
