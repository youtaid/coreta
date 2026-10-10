import { useState } from "react";

import type { WorkspaceOption } from "@/lib/domain";
import { cn } from "@/lib/utils";

import { setBooleanResponse } from "./answer-state";

interface TrueFalseAnswerProps {
  questionId: string;
  statements: readonly WorkspaceOption[];
}

function BooleanChoice({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: "Benar" | "Salah";
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="relative block cursor-pointer touch-manipulation">
      <input
        type="radio"
        name={name}
        value={label.toLowerCase()}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex min-h-touch items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors duration-200",
          "peer-focus-visible:ring-3 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-muted hover:text-foreground",
        )}
      >
        {label}
      </span>
    </label>
  );
}

export function TrueFalseAnswer({ questionId, statements }: TrueFalseAnswerProps) {
  const [responses, setResponses] = useState<Record<string, boolean>>({});

  if (statements.length === 0) {
    return <p className="text-sm text-muted-foreground">Pernyataan belum tersedia.</p>;
  }

  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="mb-3 text-sm font-semibold text-foreground">
        Tentukan benar atau salah untuk setiap pernyataan.
      </legend>
      {statements.map((statement, index) => {
        const response = responses[statement.id];
        const name = `${questionId}-${statement.id}`;

        return (
          <fieldset
            key={statement.id}
            className="grid min-w-0 gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_13rem] sm:items-center"
          >
            <legend className="sr-only">Pernyataan {index + 1}</legend>
            <p className="flex min-w-0 items-start gap-2 text-sm leading-relaxed font-medium sm:text-base">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                {statement.label || index + 1}
              </span>
              <span>{statement.text}</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <BooleanChoice
                name={name}
                label="Benar"
                checked={response === true}
                onChange={() =>
                  setResponses((current) => setBooleanResponse(current, statement.id, true))
                }
              />
              <BooleanChoice
                name={name}
                label="Salah"
                checked={response === false}
                onChange={() =>
                  setResponses((current) => setBooleanResponse(current, statement.id, false))
                }
              />
            </div>
          </fieldset>
        );
      })}
    </fieldset>
  );
}
