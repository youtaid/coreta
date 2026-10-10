import { CheckCircle2, CircleDot, Lightbulb, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { QuestionOutcome, ResultQuestion as ResultQuestionData } from "@/lib/domain";
import { formatNumber } from "@/lib/format";

const outcomeMeta: Record<
  QuestionOutcome,
  { label: string; variant: "success" | "warning" | "destructive"; Icon: typeof CheckCircle2 }
> = {
  correct: { label: "Benar", variant: "success", Icon: CheckCircle2 },
  partial: { label: "Sebagian benar", variant: "warning", Icon: CircleDot },
  incorrect: { label: "Salah", variant: "destructive", Icon: XCircle },
};

export function ResultQuestion({
  number,
  prompt,
  studentAnswer,
  correctAnswer,
  outcome,
  points,
  maxPoints,
  explanation,
  hintsUsed,
}: ResultQuestionData) {
  const { label, variant, Icon } = outcomeMeta[outcome];

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-heading text-lg font-semibold">Soal {number}</p>
          <Badge variant={variant}>
            <Icon aria-hidden />
            {label} · {formatNumber(points)}/{formatNumber(maxPoints)}
          </Badge>
        </div>

        <p>{prompt}</p>

        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-muted px-3 py-2">
            <dt className="text-sm text-muted-foreground">Jawabanmu</dt>
            <dd className="font-semibold">{studentAnswer}</dd>
          </div>
          {outcome !== "correct" && (
            <div className="rounded-lg bg-muted px-3 py-2">
              <dt className="text-sm text-muted-foreground">Jawaban benar</dt>
              <dd className="font-semibold">{correctAnswer}</dd>
            </div>
          )}
        </dl>

        {hintsUsed > 0 && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lightbulb className="size-4" aria-hidden />
            {hintsUsed} petunjuk diterima
          </p>
        )}

        <details className="group rounded-lg border">
          <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-4 py-2 font-medium focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
            <span>Pembahasan</span>
            <span aria-hidden className="text-muted-foreground group-open:hidden">
              Buka
            </span>
            <span aria-hidden className="hidden text-muted-foreground group-open:inline">
              Tutup
            </span>
          </summary>
          <p className="border-t px-4 py-3">{explanation}</p>
        </details>
      </CardContent>
    </Card>
  );
}
