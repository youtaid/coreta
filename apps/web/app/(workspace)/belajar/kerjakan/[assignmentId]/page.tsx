"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useWorkspaceStore } from "@/components/workspace/store";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";
import { getMockWorkspaceAssignment } from "@/lib/mock/workspace";

interface WorkspacePageProps {
  params: Promise<{ assignmentId: string }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const router = useRouter();
  const { assignmentId } = use(params);

  const assignment = getMockWorkspaceAssignment(assignmentId);
  const assignmentQuestions = assignment.questions;

  const {
    questions,
    currentQuestionIndex,
    answers,
    strokesByQuestion,
    submissionStatus,
    scoreResults,
    overallScore,
    elapsedSeconds,
    initialize,
    goToQuestion,
    nextQuestion,
    previousQuestion,
    setAnswer,
    setPgAnswer,
    setStrokes,
    submit,
  } = useWorkspaceStore();

  // Initialize store when assignment loads
  useEffect(() => {
    initialize(assignmentId, assignmentQuestions);
  }, [assignmentId, assignmentQuestions, initialize]);

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      useWorkspaceStore.getState().tickTimer();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeQuestions = questions.length > 0 ? questions : assignmentQuestions;
  const currentQuestion = activeQuestions[currentQuestionIndex] ?? activeQuestions[0];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const currentOptionId = currentAnswer?.type === "pg" ? currentAnswer.choice : null;
  const currentScoreResult = currentQuestion ? scoreResults[currentQuestion.id] : undefined;
  const currentStrokes = currentQuestion ? (strokesByQuestion[currentQuestion.id] ?? []) : [];

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    setPgAnswer(currentQuestion.id, optionId);
  };

  const handleSubmit = async () => {
    if (submissionStatus === "graded") {
      router.push(`/belajar/hasil/${assignmentId || assignment.id}`);
      return;
    }
    await submit();
  };

  const handleViewResults = () => {
    router.push(`/belajar/hasil/${assignmentId || assignment.id}`);
  };

  return (
    <WorkspaceLayout
      question={currentQuestion}
      questions={activeQuestions}
      currentQuestionIndex={currentQuestionIndex}
      totalQuestions={activeQuestions.length}
      worksheetTitle={assignment.title}
      stageName={assignment.stageName}
      selectedOptionId={currentOptionId}
      currentAnswer={currentAnswer}
      onAnswerChange={(ans) => currentQuestion && setAnswer(currentQuestion.id, ans)}
      scoreResult={currentScoreResult}
      strokes={currentStrokes}
      onStrokesChange={(strokes) => currentQuestion && setStrokes(currentQuestion.id, strokes)}
      elapsedSeconds={elapsedSeconds}
      submissionStatus={submissionStatus}
      overallScore={overallScore}
      isSubmitting={submissionStatus === "submitting"}
      onSelectOption={handleSelectOption}
      onSelectQuestion={goToQuestion}
      onPreviousQuestion={previousQuestion}
      onNextQuestion={nextQuestion}
      onSubmit={handleSubmit}
      onViewResults={handleViewResults}
      onExitHref="/belajar/worksheet"
    />
  );
}
