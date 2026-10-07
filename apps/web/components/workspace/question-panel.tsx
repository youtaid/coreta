"use client";

import type { Answer, ScoreResult } from "@coreta/scoring";
import { AlertCircle, Check, CheckCircle2, Lightbulb } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { QuestionTier, WorkspaceQuestion } from "@/lib/domain";
import { cn } from "@/lib/utils";

import { SelectionOption } from "./answer/selection-option";
import { MathFormula } from "./media/math-formula";

export interface QuestionPanelProps {
  question: WorkspaceQuestion;
  selectedOptionId?: string | null;
  onSelectOption?: (optionId: string) => void;
  currentAnswer?: Answer;
  onAnswerChange?: (answer: Answer) => void;
  scoreResult?: ScoreResult;
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
  currentAnswer,
  onAnswerChange,
  scoreResult,
  className,
}: QuestionPanelProps) {
  const tierInfo = tierLabels[question.tier] ?? tierLabels.dasar;

  // Selected option for PG (either from prop or from currentAnswer)
  const effectivePgChoice =
    selectedOptionId ?? (currentAnswer?.type === "pg" ? currentAnswer.choice : null);

  const handlePgSelect = (optionId: string) => {
    onSelectOption?.(optionId);
    onAnswerChange?.({ type: "pg", choice: optionId });
  };

  const handlePgkToggle = (optionId: string) => {
    const prevChoices = currentAnswer?.type === "pgk" ? currentAnswer.choices : [];
    const nextChoices = prevChoices.includes(optionId)
      ? prevChoices.filter((id) => id !== optionId)
      : [...prevChoices, optionId];
    onAnswerChange?.({ type: "pgk", choices: nextChoices });
  };

  const handleBsChange = (statementId: string, value: boolean) => {
    const prevRows = currentAnswer?.type === "bs" ? currentAnswer.rows : {};
    const nextRows = { ...prevRows, [statementId]: value };
    onAnswerChange?.({ type: "bs", rows: nextRows });
  };

  const handleIsianChange = (text: string) => {
    onAnswerChange?.({ type: "isian", text });
  };

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
        {/* Grading Result Banner (shown when question has been graded) */}
        {scoreResult && (
          <div
            data-testid="question-score-banner"
            className={cn(
              "rounded-xl border p-3.5 transition-all",
              scoreResult.correct
                ? "border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200"
                : scoreResult.score > 0
                  ? "border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200"
                  : "border-destructive/40 bg-destructive/10 text-destructive",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {scoreResult.correct ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="size-5 shrink-0" />
                )}
                <span className="text-sm font-bold">
                  {scoreResult.correct
                    ? "Jawaban Tepat (100%)"
                    : scoreResult.score > 0
                      ? `Jawaban Sebagian (${Math.round(scoreResult.score * 100)}%)`
                      : "Jawaban Belum Tepat (0%)"}
                </span>
              </div>
              <Badge
                variant={
                  scoreResult.correct ? "default" : scoreResult.score > 0 ? "secondary" : "destructive"
                }
                className="text-xs font-bold"
              >
                Skor: {Number((scoreResult.score * 100).toFixed(0))}%
              </Badge>
            </div>

            {/* Display Hints if any wrong choices or safeguard triggered */}
            {scoreResult.hints.length > 0 && (
              <div className="mt-2.5 space-y-1.5 pt-2 border-t border-border/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  <Lightbulb className="size-3.5 shrink-0" />
                  <span>Petunjuk Pengecoh:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-xs text-foreground/90">
                  {scoreResult.hints.map((hint, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {hint.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

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

        {/* Dynamic Answer Panels depending on answerType */}
        {question.answerType === "pg" && question.options && question.options.length > 0 && (
          <div className="space-y-2 pt-1" role="radiogroup" aria-label="Pilihan jawaban tunggal">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Pilih satu jawaban:</span>
              <span className="text-[11px] text-muted-foreground/70">Target sentuh ≥ 44px</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {question.options.map((option) => {
                const isSelected = effectivePgChoice === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handlePgSelect(option.id)}
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

        {question.answerType === "pgk" && question.options && question.options.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Pilih semua pernyataan yang benar (PG Kompleks):</span>
              <span className="text-[11px] text-muted-foreground/70">Pilihan ganda jamak</span>
            </div>
            <div className="space-y-2">
              {question.options.map((option) => {
                const currentChoices =
                  currentAnswer?.type === "pgk" ? currentAnswer.choices : [];
                const isChecked = currentChoices.includes(option.id);

                return (
                  <SelectionOption
                    key={option.id}
                    type="checkbox"
                    name={`pgk-${question.id}`}
                    option={option}
                    checked={isChecked}
                    onChange={() => handlePgkToggle(option.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {question.answerType === "bs" && question.statements && question.statements.length > 0 && (
          <div className="space-y-2 pt-1">
            <fieldset className="min-w-0 space-y-3">
              <legend className="mb-2 text-xs font-medium text-muted-foreground">
                Tentukan benar atau salah untuk setiap pernyataan:
              </legend>
              <div className="space-y-2.5">
                {question.statements.map((stmt) => {
                  const currentRows =
                    currentAnswer?.type === "bs" ? currentAnswer.rows : {};
                  const isTrue = currentRows[stmt.id] === true;
                  const isFalse = currentRows[stmt.id] === false;

                  return (
                    <div
                      key={stmt.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-border/80 bg-background/60 p-3"
                    >
                      <span className="text-xs sm:text-sm font-medium text-foreground">
                        {stmt.text}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleBsChange(stmt.id, true)}
                          className={cn(
                            "min-h-touch px-3 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer",
                            isTrue
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted",
                          )}
                        >
                          Benar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBsChange(stmt.id, false)}
                          className={cn(
                            "min-h-touch px-3 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer",
                            isFalse
                              ? "bg-destructive text-destructive-foreground border-destructive"
                              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted",
                          )}
                        >
                          Salah
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          </div>
        )}

        {question.answerType === "isian" && (
          <div className="space-y-3 pt-1">
            <label
              htmlFor={`isian-${question.id}`}
              className="block text-xs font-medium text-muted-foreground"
            >
              Ketikkan jawaban isian singkat:
            </label>
            <textarea
              id={`isian-${question.id}`}
              value={currentAnswer?.type === "isian" ? currentAnswer.text ?? "" : ""}
              onChange={(e) => handleIsianChange(e.target.value)}
              rows={3}
              placeholder={question.placeholder ?? "Contoh: 60.000 atau Rp60.000"}
              className="min-h-24 w-full resize-none rounded-xl border border-input bg-background px-4 py-3 font-mono text-base sm:text-lg leading-relaxed text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Sistem otomatis menormalkan penulisan titik ribuan, desimal koma, persen, pecahan, dan satuan mata uang.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
