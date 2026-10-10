import { useId, useState } from "react";

import type { WorkspaceOption } from "@/lib/domain";

import { SelectionOption } from "./selection-option";

interface MultipleChoiceAnswerProps {
  questionId: string;
  options: readonly WorkspaceOption[];
}

export function MultipleChoiceAnswer({ questionId, options }: MultipleChoiceAnswerProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const groupId = useId();

  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">Pilihan jawaban belum tersedia.</p>;
  }

  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="mb-3 text-sm font-semibold text-foreground">
        Pilih satu jawaban yang paling tepat.
      </legend>
      {options.map((option) => (
        <SelectionOption
          key={option.id}
          type="radio"
          name={`${questionId}-${groupId}`}
          option={option}
          checked={selectedOptionId === option.id}
          onChange={() => setSelectedOptionId(option.id)}
        />
      ))}
    </fieldset>
  );
}
