"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";

import { WorkspaceLayout } from "@/components/workspace/workspace-layout";
import { mockWorkspaceAssignment } from "@/lib/mock/workspace";

interface WorkspacePageProps {
  params: Promise<{ assignmentId: string }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const router = useRouter();
  const { assignmentId } = use(params);

  const assignment = mockWorkspaceAssignment;
  const questions = assignment.questions;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const currentQuestion = questions[currentQuestionIndex] ?? questions[0];
  const currentOptionId = currentQuestion ? selectedAnswers[currentQuestion.id] : null;

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Navigate to results page after completing the workspace
    router.push(`/belajar/hasil/${assignmentId || assignment.id}`);
  };

  return (
    <WorkspaceLayout
      question={currentQuestion}
      questions={questions}
      currentQuestionIndex={currentQuestionIndex}
      totalQuestions={questions.length}
      worksheetTitle={assignment.title}
      stageName={assignment.stageName}
      selectedOptionId={currentOptionId}
      onSelectOption={handleSelectOption}
      onSelectQuestion={setCurrentQuestionIndex}
      onPreviousQuestion={handlePrevious}
      onNextQuestion={handleNext}
      onSubmit={handleSubmit}
      onExitHref="/belajar/worksheet"
    />
  );
}
