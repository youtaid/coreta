import { useId, useState } from "react";

import type { WorkspaceOption } from "@/lib/domain";

import { toggleSelection } from "./answer-state";
import { SelectionOption } from "./selection-option";

interface MultipleSelectAnswerProps {
  questionId: string;
  options: readonly WorkspaceOption[];
}

export function MultipleSelectAnswer({ questionId, options }: MultipleSelectAnswerProps) {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const groupId = useId();

  function toggleOption(optionId: string) {
    setSelectedOptionIds((current) => toggleSelection(current, optionId));
  }

  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">Pernyataan jawaban belum tersedia.</p>;
  }

  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="mb-1 text-sm font-semibold text-foreground">
        Pilih semua pernyataan yang benar.
      </legend>
      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
        {selectedOptionIds.length === 0
          ? "Kamu boleh memilih lebih dari satu jawaban."
          : `${selectedOptionIds.length} jawaban dipilih.`}
      </p>
      {options.map((option) => (
        <SelectionOption
          key={option.id}
          type="checkbox"
          name={`${questionId}-${groupId}`}
          option={option}
          checked={selectedOptionIds.includes(option.id)}
          onChange={() => toggleOption(option.id)}
        />
      ))}
    </fieldset>
  );
}
