"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { toast } from "@/components/ui/toast";
import { useWorkspaceStore } from "@/components/workspace/store";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";
import type { WorksheetGrader, WorkspaceQuestion } from "@/lib/domain";

import { gradeWorksheet } from "./actions";

export interface WorkspaceAssignment {
  id: string;
  title: string;
  stageName: string;
  questions: WorkspaceQuestion[];
}

const serverGrader: WorksheetGrader = ({ assignmentId, answers, elapsedSeconds }) =>
  gradeWorksheet({ assignmentId, answers, elapsedSeconds });

export function WorkspaceScreen({ assignment }: { assignment: WorkspaceAssignment }) {
  const router = useRouter();
  const {
    questions,
    assignmentId,
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

  useEffect(() => {
    initialize(assignment.id, assignment.questions, serverGrader);
  }, [assignment.id, assignment.questions, initialize]);

  useEffect(() => {
    const timer = setInterval(() => useWorkspaceStore.getState().tickTimer(), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sebelum store terisi (render pertama), tampilkan soal dari server.
  const activeQuestions = assignmentId === assignment.id ? questions : assignment.questions;
  const currentQuestion = activeQuestions[currentQuestionIndex] ?? activeQuestions[0];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const currentOptionId = currentAnswer?.type === "pg" ? currentAnswer.choice : null;

  // Halaman hasil membaca percobaan yang tersimpan; penyimpanan baru ada di Fase 38. Sampai itu,
  // hasil per soal tampil di ruang kerja dan "Lihat Hasil" kembali ke daftar worksheet.
  const backToList = () => router.push("/belajar/worksheet");

  const handleSubmit = async () => {
    if (submissionStatus === "graded") return backToList();
    try {
      await submit();
    } catch {
      toast.add({
        type: "destructive",
        title: "Jawaban belum terkirim",
        description: "Periksa koneksi internet, lalu tekan Kirim lagi. Jawabanmu masih ada.",
      });
    }
  };

  return (
    <WorkspaceLayout
      question={currentQuestion}
      questions={activeQuestions}
      currentQuestionIndex={currentQuestionIndex}
      totalQuestions={activeQuestions.length}
      worksheetTitle={assignment.title}
      stageName={assignment.stageName}
      selectedOptionId={currentOptionId ?? null}
      currentAnswer={currentAnswer}
      onAnswerChange={(answer) => currentQuestion && setAnswer(currentQuestion.id, answer)}
      scoreResult={currentQuestion ? scoreResults[currentQuestion.id] : undefined}
      strokes={currentQuestion ? (strokesByQuestion[currentQuestion.id] ?? []) : []}
      onStrokesChange={(strokes) => currentQuestion && setStrokes(currentQuestion.id, strokes)}
      elapsedSeconds={elapsedSeconds}
      submissionStatus={submissionStatus}
      overallScore={overallScore}
      isSubmitting={submissionStatus === "submitting"}
      onSelectOption={(optionId) => currentQuestion && setPgAnswer(currentQuestion.id, optionId)}
      onSelectQuestion={goToQuestion}
      onPreviousQuestion={previousQuestion}
      onNextQuestion={nextQuestion}
      onSubmit={handleSubmit}
      onViewResults={backToList}
      onExitHref="/belajar/worksheet"
    />
  );
}
