"use client";

import { useState } from "react";

import { WorkspaceLayout } from "@/components/workspace/workspace-layout";
import type { WorkspaceQuestion } from "@/lib/domain";

interface PreviewWorkspaceProps {
  question: WorkspaceQuestion;
  worksheetTitle: string;
  stageName: string;
  exitHref: string;
}

/** The student workspace around a single item, with local state so options can be tapped. */
export function PreviewWorkspace({
  question,
  worksheetTitle,
  stageName,
  exitHref,
}: PreviewWorkspaceProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  return (
    <WorkspaceLayout
      question={question}
      questions={[question]}
      currentQuestionIndex={0}
      totalQuestions={1}
      worksheetTitle={worksheetTitle}
      stageName={stageName}
      selectedOptionId={selectedOptionId}
      onSelectOption={setSelectedOptionId}
      onExitHref={exitHref}
    />
  );
}
