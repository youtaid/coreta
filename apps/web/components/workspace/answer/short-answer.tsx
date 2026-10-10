import { Check, PencilLine, ScanText } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { resolveRecognizedAnswer } from "./answer-state";

interface ShortAnswerProps {
  questionId: string;
  mockRecognition?: string;
}

type RecognitionState = "editing" | "confirming" | "confirmed";

export function ShortAnswer({ questionId, mockRecognition }: ShortAnswerProps) {
  const [answer, setAnswer] = useState("");
  const [recognizedAnswer, setRecognizedAnswer] = useState("");
  const [recognitionState, setRecognitionState] = useState<RecognitionState>("editing");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputId = `${questionId}-short-answer`;
  const readableAnswer = resolveRecognizedAnswer(answer, mockRecognition);
  const canRead = readableAnswer.length > 0;

  function readAnswer() {
    if (!canRead) return;

    setRecognizedAnswer(readableAnswer);
    setRecognitionState("confirming");
  }

  function editAgain() {
    setRecognitionState("editing");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="space-y-2">
        <label htmlFor={inputId} className="block text-sm font-semibold text-foreground">
          Tulis jawaban singkatmu.
        </label>
        <textarea
          ref={inputRef}
          id={inputId}
          value={answer}
          onChange={(event) => {
            setAnswer(event.target.value);
            setRecognitionState("editing");
          }}
          rows={4}
          placeholder="Contoh: x = 3"
          className="min-h-28 w-full resize-none rounded-xl border border-input bg-background px-4 py-3 font-hand text-xl leading-relaxed text-foreground shadow-xs outline-none placeholder:font-sans placeholder:text-base placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        disabled={!canRead}
        onClick={readAnswer}
      >
        <ScanText className="size-5" aria-hidden />
        Baca jawaban
      </Button>

      <div aria-live="polite">
        {recognitionState !== "editing" && (
          <section
            aria-labelledby={`${inputId}-confirmation-title`}
            className={cn(
              "space-y-3 rounded-xl border p-4",
              recognitionState === "confirmed"
                ? "border-success/40 bg-success/10"
                : "border-primary/30 bg-secondary/50",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full",
                  recognitionState === "confirmed"
                    ? "bg-success text-success-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {recognitionState === "confirmed" ? (
                  <Check className="size-5" aria-hidden />
                ) : (
                  <ScanText className="size-5" aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <h3 id={`${inputId}-confirmation-title`} className="font-heading font-bold">
                  {recognitionState === "confirmed"
                    ? "Jawaban sudah dikonfirmasi"
                    : "Benar ini maksudmu?"}
                </h3>
                <p className="mt-1 break-words font-hand text-xl font-bold text-foreground">
                  {recognizedAnswer}
                </p>
              </div>
            </div>

            {recognitionState === "confirming" && (
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" onClick={() => setRecognitionState("confirmed")}>
                  <Check className="size-4" aria-hidden />
                  Ya, benar
                </Button>
                <Button type="button" variant="outline" onClick={editAgain}>
                  <PencilLine className="size-4" aria-hidden />
                  Tulis ulang
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
