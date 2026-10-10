// Zustand store for Workspace State (Fase 28).
// Manages:
// - Active question & 8-question navigation
// - Answers for all 4 types (PG, PGK, BS, Isian)
// - Digital ink strokes retained per question during session
// - Timer tracking elapsed time
// - Submission workflow: draft -> submitting -> graded
// - Grading results and hints from @coreta/scoring through an injected grader: the real workspace
//   passes a server action (answer keys stay on the server), tests pass lib/mock/api.ts

import type { Stroke } from "@coreta/ink";
import type { Answer, ScoreResult } from "@coreta/scoring";
import { create } from "zustand";

import type { GradedWorksheetResult, WorksheetGrader, WorkspaceQuestion } from "@/lib/domain";

export type SubmissionStatus = "draft" | "submitting" | "graded";

export interface WorkspaceState {
  // --- Data & Navigation ---
  assignmentId: string;
  questions: readonly WorkspaceQuestion[];
  currentQuestionIndex: number;
  grader: WorksheetGrader | null;

  // --- Answers & Ink Retention ---
  answers: Record<string, Answer>;
  strokesByQuestion: Record<string, Stroke[]>;

  // --- Submission & Grading ---
  submissionStatus: SubmissionStatus;
  scoreResults: Record<string, ScoreResult>;
  overallScore: number | null;
  completedAt: number | null;

  // --- Timer ---
  elapsedSeconds: number;
  isTimerRunning: boolean;

  // --- Actions ---
  initialize: (
    assignmentId: string,
    questions: readonly WorkspaceQuestion[],
    grader: WorksheetGrader,
  ) => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  setAnswer: (questionId: string, answer: Answer) => void;
  setPgAnswer: (questionId: string, choiceId: string) => void;
  setPgkAnswer: (questionId: string, choices: string[]) => void;
  setBsAnswer: (questionId: string, rows: Record<string, boolean>) => void;
  setIsianAnswer: (questionId: string, text: string) => void;
  setStrokes: (questionId: string, strokes: Stroke[]) => void;
  getStrokes: (questionId: string) => Stroke[];
  startTimer: () => void;
  stopTimer: () => void;
  tickTimer: () => void;
  submit: () => Promise<GradedWorksheetResult>;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  assignmentId: "",
  questions: [],
  currentQuestionIndex: 0,
  grader: null,

  answers: {},
  strokesByQuestion: {},

  submissionStatus: "draft",
  scoreResults: {},
  overallScore: null,
  completedAt: null,

  elapsedSeconds: 0,
  isTimerRunning: true,

  initialize: (assignmentId, questions, grader) => {
    set({
      assignmentId,
      questions,
      grader,
      currentQuestionIndex: 0,
      answers: {},
      strokesByQuestion: {},
      submissionStatus: "draft",
      scoreResults: {},
      overallScore: null,
      completedAt: null,
      elapsedSeconds: 0,
      isTimerRunning: true,
    });
  },

  goToQuestion: (index: number) => {
    const { questions } = get();
    if (index >= 0 && index < questions.length) {
      set({ currentQuestionIndex: index });
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  previousQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

  setAnswer: (questionId: string, answer: Answer) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: answer,
      },
    }));
  },

  setPgAnswer: (questionId: string, choiceId: string) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: { type: "pg", choice: choiceId },
      },
    }));
  },

  setPgkAnswer: (questionId: string, choices: string[]) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: { type: "pgk", choices },
      },
    }));
  },

  setBsAnswer: (questionId: string, rows: Record<string, boolean>) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: { type: "bs", rows },
      },
    }));
  },

  setIsianAnswer: (questionId: string, text: string) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: { type: "isian", text },
      },
    }));
  },

  setStrokes: (questionId: string, strokes: Stroke[]) => {
    set((state) => ({
      strokesByQuestion: {
        ...state.strokesByQuestion,
        [questionId]: strokes,
      },
    }));
  },

  getStrokes: (questionId: string): Stroke[] => {
    return get().strokesByQuestion[questionId] ?? [];
  },

  startTimer: () => set({ isTimerRunning: true }),
  stopTimer: () => set({ isTimerRunning: false }),
  tickTimer: () => {
    const { isTimerRunning, submissionStatus } = get();
    if (isTimerRunning && submissionStatus === "draft") {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
    }
  },

  submit: async () => {
    const { assignmentId, answers, questions, elapsedSeconds, grader } = get();
    if (!grader) throw new Error("Ruang kerja belum diinisialisasi dengan penilai.");
    set({ submissionStatus: "submitting", isTimerRunning: false });

    let result: GradedWorksheetResult;
    try {
      result = await grader({
        assignmentId,
        answers,
        questionIds: questions.map((q) => q.id),
        elapsedSeconds,
      });
    } catch (error) {
      // Penilaian gagal (mis. koneksi putus): jawaban tetap ada, siswa bisa mengirim ulang.
      set({ submissionStatus: "draft", isTimerRunning: true });
      throw error;
    }

    set({
      submissionStatus: "graded",
      scoreResults: result.results,
      overallScore: result.overallScore,
      completedAt: result.completedAt,
    });

    return result;
  },

  reset: () => {
    set({
      currentQuestionIndex: 0,
      answers: {},
      strokesByQuestion: {},
      submissionStatus: "draft",
      scoreResults: {},
      overallScore: null,
      completedAt: null,
      elapsedSeconds: 0,
      isTimerRunning: true,
    });
  },
}));
