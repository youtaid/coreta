import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { QuestionTier, WorkspaceQuestion } from "@/lib/domain";
import { cn } from "@/lib/utils";

import { MathFormula } from "./media/math-formula";

export interface QuestionPanelProps {
  question: WorkspaceQuestion;
  selectedOptionId?: string | null;
  onSelectOption?: (optionId: string) => void;
  className?: string;
  compact?: boolean;
}

const tierLabels: Record<
  QuestionTier,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  dasar: { label: "Dasar", variant: "secondary" },
  mahir: { label: "Mahir", variant: "default" },
  ujian: { label: "Ujian UTBK", variant: "destructive" },
};

export function QuestionPanel({
  question,
  selectedOptionId,
  onSelectOption,
  className,
}: QuestionPanelProps) {
  const tierInfo = tierLabels[question.tier] ?? tierLabels.dasar;

  return (
    <section
      aria-label={`Soal nomor ${question.number}`}
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs",
        className,
      )}
    >
      {/* Header bar: nomor butir, tingkat kesulitan, kompetensi */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            {question.number}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground">
              Soal {question.number}
              <span className="text-muted-foreground font-normal">
                {" "}
                / {question.totalQuestions}
              </span>
            </span>
            <Badge variant={tierInfo.variant} className="h-5 px-1.5 text-[10px]">
              {tierInfo.label}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 text-right">
          <span className="hidden truncate text-xs font-medium text-muted-foreground sm:inline max-w-[180px]">
            {question.competencyName}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground/80">{question.code}</span>
        </div>
      </div>

      {/* Scrollable question body and options container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Question Prompt */}
        <div className="space-y-2">
          <p className="text-sm font-medium leading-relaxed text-foreground sm:text-base">
            {question.prompt}
          </p>

          {/* Mathematical Formula block rendered with KaTeX */}
          {question.formula && (
            <div className="my-2.5 flex items-center justify-center rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 font-mono text-xs text-primary sm:text-sm dark:bg-primary/10">
              <MathFormula formula={question.formula} displayMode />
            </div>
          )}
        </div>

        {/* Answer Options */}
        {question.options && question.options.length > 0 && (
          <div className="space-y-2 pt-1" role="radiogroup" aria-label="Pilihan jawaban">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Pilih satu jawaban:</span>
              <span className="text-[11px] text-muted-foreground/70">Target sentuh ≥ 44px</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {question.options.map((option) => {
                const isSelected = selectedOptionId === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onSelectOption?.(option.id)}
                    className={cn(
                      "group flex min-h-touch w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-xs sm:text-sm font-medium transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-ring",
                      isSelected
                        ? "border-primary bg-secondary/80 text-foreground shadow-xs ring-1 ring-primary/40"
                        : "border-border/80 bg-background/60 text-foreground/90 hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted/60 text-muted-foreground group-hover:border-primary/50 group-hover:text-foreground",
                      )}
                    >
                      {isSelected ? <Check className="size-3.5 stroke-[3]" /> : option.label}
                    </span>
                    <span className="flex-1 font-mono sm:font-sans">{option.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
