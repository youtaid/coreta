// View-model shapes that domain components accept as props. They mirror the planned tables
// in TIP §4 but carry only what screens display. Mock data (lib/mock) and, later, the
// Supabase queries both map into these shapes.

export const MASTERY_THRESHOLD = 0.8;

export type StageStatus = "locked" | "active" | "mastered";

export interface Stage {
  number: number; // 0-8
  name: string;
  status: StageStatus;
  /** Share of competencies mastered in this stage, 0-1. */
  progress: number;
}

export type WorksheetStatus = "new" | "in_progress" | "review" | "completed";

export interface WorksheetSummary {
  id: string;
  title: string;
  stageName: string;
  itemCount: number;
  answeredCount: number;
  estimatedMinutes: number;
  status: WorksheetStatus;
  /** Final score 0-1, only for completed worksheets. */
  score?: number;
  dueLabel?: string;
}

export interface CompetencyMastery {
  code: string;
  name: string;
  /** Mastery score 0-1; mastered at >= MASTERY_THRESHOLD. */
  score: number;
}

export interface StatSummary {
  label: string;
  value: string;
  /** Relative change vs the previous period, e.g. 0.12 = +12%. */
  change?: number;
  changeLabel?: string;
  /** False when a decrease is the good direction (e.g. time spent per item). */
  higherIsBetter?: boolean;
}

export type PlanId = "monthly" | "semester" | "annual";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  strikePrice?: number;
  months: number;
  description: string;
  features: string[];
}

export type SubscriptionStatus =
  "trialing" | "active" | "paused" | "past_due" | "canceled" | "expired";

export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "trialing",
  "active",
  "paused",
  "past_due",
  "canceled",
  "expired",
];

export type QuestionOutcome = "correct" | "partial" | "incorrect";

export interface ResultQuestion {
  number: number;
  prompt: string;
  studentAnswer: string;
  correctAnswer: string;
  outcome: QuestionOutcome;
  points: number;
  maxPoints: number;
  /** Worked solution; stays collapsed until the student opens it. */
  explanation: string;
  hintsUsed: number;
}

export interface WorksheetResult {
  assignmentId: string;
  title: string;
  stageName: string;
  /** Final score 0-1. */
  score: number;
  durationMinutes: number;
  questions: ResultQuestion[];
}

export type WorkspaceLayoutMode = "standar" | "media" | "bacaan";

export type QuestionTier = "dasar" | "mahir" | "ujian";

export type AnswerType = "pg" | "pgk" | "bs" | "isian";

export interface WorkspaceOption {
  id: string;
  label: string;
  text: string;
}

export interface WorkspaceMedia {
  id: string;
  kind: "diagram" | "image" | "table" | "audio" | "video";
  altText: string;
  title?: string;
  caption?: string;
  url?: string;
}

export interface WorkspaceStimulus {
  id: string;
  kind: "reading" | "table" | "media_set";
  title: string;
  subtitle?: string;
  bodyText: string;
  source?: string;
}

export interface WorkspaceQuestion {
  id: string;
  number: number;
  totalQuestions: number;
  code: string;
  competencyName: string;
  tier: QuestionTier;
  answerType: AnswerType;
  layoutMode: WorkspaceLayoutMode;
  prompt: string;
  formula?: string;
  options?: WorkspaceOption[];
  media?: WorkspaceMedia;
  stimulus?: WorkspaceStimulus;
}
