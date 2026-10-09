"use client";

import {
  CheckSquare2,
  CircleDot,
  ListChecks,
  TextCursorInput,
  type LucideIcon,
} from "lucide-react";
import { useId } from "react";

import type { AnswerType, WorkspaceQuestion } from "@/lib/domain";
import { cn } from "@/lib/utils";

import { MultipleChoiceAnswer } from "./answer/multiple-choice-answer";
import { MultipleSelectAnswer } from "./answer/multiple-select-answer";
import { ShortAnswer } from "./answer/short-answer";
import { TrueFalseAnswer } from "./answer/true-false-answer";

type AnswerQuestion = Pick<WorkspaceQuestion, "id" | "answerType" | "options">;

export interface AnswerPanelProps {
  question: AnswerQuestion;
  /** Simulated handwriting-reader output used only by the short-answer confirmation UI. */
  mockRecognition?: string;
  className?: string;
}

const answerTypeMeta: Record<AnswerType, { label: string; Icon: LucideIcon }> = {
  pg: { label: "Pilihan ganda", Icon: CircleDot },
  pgk: { label: "Pilihan ganda kompleks", Icon: CheckSquare2 },
  bs: { label: "Benar atau salah", Icon: ListChecks },
  isian: { label: "Isian singkat", Icon: TextCursorInput },
};

export function AnswerPanel({ question, mockRecognition, className }: AnswerPanelProps) {
  const titleId = useId();
  const { Icon, label } = answerTypeMeta[question.answerType];
  const options = question.options ?? [];

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs",
        className,
      )}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-muted/40 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Jawaban
          </p>
          <h2 id={titleId} className="font-heading text-base font-bold">
            {label}
          </h2>
        </div>
      </header>

      <div className="min-h-0 flex-1 p-4">
        {question.answerType === "pg" && (
          <MultipleChoiceAnswer key={question.id} questionId={question.id} options={options} />
        )}
        {question.answerType === "pgk" && (
          <MultipleSelectAnswer key={question.id} questionId={question.id} options={options} />
        )}
        {question.answerType === "bs" && (
          <TrueFalseAnswer key={question.id} questionId={question.id} statements={options} />
        )}
        {question.answerType === "isian" && (
          <ShortAnswer
            key={question.id}
            questionId={question.id}
            mockRecognition={mockRecognition}
          />
        )}
      </div>
    </section>
  );
}
