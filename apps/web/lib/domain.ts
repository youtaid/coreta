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
  /** Tahap 0-8 the worksheet belongs to; drives the stage filter. */
  stageNumber: number;
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

export interface MediaTableData {
  headers: string[];
  rows: string[][];
  footnote?: string;
}

export interface MediaCaptionCue {
  id?: string;
  start: number;
  end: number;
  text: string;
}

export interface WorkspaceMedia {
  id: string;
  kind: "diagram" | "image" | "table" | "audio" | "video";
  altText: string;
  title?: string;
  caption?: string;
  url?: string;
  /** Whether the student may paste this media onto the scratch area to write on top of it. */
  pasteable?: boolean;
  /** Structured table data when kind === "table" */
  tableData?: MediaTableData;
  /** Text transcript for audio playback */
  transcript?: string;
  /** Optional audio speaker or source metadata */
  audioSpeaker?: string;
  /** Subtitles / closed caption track or cues for video */
  captionTrackUrl?: string;
  captions?: MediaCaptionCue[];
  /** Optional poster image for video */
  posterUrl?: string;
  /** Optional duration label (e.g. "01:25") */
  durationLabel?: string;
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
  statements?: WorkspaceOption[];
  placeholder?: string;
  media?: WorkspaceMedia;
  stimulus?: WorkspaceStimulus;
}

export interface ActivityDay {
  /** Calendar date as YYYY-MM-DD. */
  date: string;
  /** Items answered that day; undefined for days that have not happened yet. */
  count?: number;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** Display time such as "09.12"; supplied by the caller so renders stay deterministic. */
  timeLabel: string;
}

export interface WeeklyTrendPoint {
  /** ISO week id such as "2026-W40". */
  weekId: string;
  /** Short range such as "28 Sep–4 Okt". */
  label: string;
  itemsDone: number;
  /** Share of items answered correctly, 0-1. */
  accuracy: number;
}

export interface ReportAttention {
  title: string;
  detail: string;
}

export interface ReportPlanWeek {
  title: string;
  goals: string[];
}

export interface ReportSampleInk {
  /** What the child was solving, shown above the handwriting. */
  prompt: string;
  /** Lines of handwriting, rendered in the handwriting font. */
  lines: string[];
  /** Text alternative for the handwriting sample. */
  altText: string;
  caption: string;
}

export interface WeeklyReport {
  weekId: string;
  weekLabel: string;
  studentName: string;
  /** One-sentence takeaway shown on the list card. */
  headline: string;
  narrative: string;
  stats: StatSummary[];
  competencies: CompetencyMastery[];
  attention: ReportAttention[];
  sampleInk: ReportSampleInk;
  plan: ReportPlanWeek[];
}

export type StudentLoginMethod = "email" | "code";

export interface ChildProfile {
  id: string;
  name: string;
  grade: string;
  currentStage: string;
  /** Items per day that count as reaching the daily target. */
  dailyGoal: number;
  loginMethod: StudentLoginMethod;
  /** Email address or login code, as shown to the parent. */
  loginLabel: string;
}

export type SubscriptionAction =
  "subscribe" | "change_plan" | "pause" | "resume" | "update_payment" | "cancel" | "reactivate";

export interface SubscriptionFact {
  label: string;
  value: string;
}

/** What the subscription screen shows for one status. */
export interface SubscriptionView {
  status: SubscriptionStatus;
  planId: PlanId;
  /** One or two sentences explaining the status and what happens next. */
  summary: string;
  facts: SubscriptionFact[];
  /** Null while no payment method exists, as during the free trial. */
  paymentMethod: string | null;
}

export type InvoiceStatus = "paid" | "pending" | "failed" | "refunded";

export interface Invoice {
  id: string;
  number: string;
  /** Display date such as "3 Okt 2026". */
  dateLabel: string;
  description: string;
  amount: number;
  status: InvoiceStatus;
}

export type HintReportStatus = "open" | "valid" | "revised" | "item_flagged";

export type HintReportReason = "unclear" | "leaks_answer" | "wrong_concept" | "display_issue";

export interface HintReport {
  id: string;
  /** Item the hint belongs to; the review panel links to its editor. */
  itemId: string;
  itemCode: string;
  competencyName: string;
  reason: HintReportReason;
  /** The hint text the student was shown. */
  hintText: string;
  /** Anonymised, e.g. "Siswa #1042". */
  reporterLabel: string;
  reportedLabel: string;
  status: HintReportStatus;
  /**
   * Minutes left until the 24-hour review deadline, measured when the page loads. Mock data cannot
   * hold a fixed deadline because "now" moves; the real table stores `due_at` (created + 24 h).
   */
  dueInMinutes: number;
}

export interface FailedJob {
  id: string;
  /** Queue the job belongs to, e.g. "ink.analyze". */
  queue: string;
  summary: string;
  error: string;
  attempts: number;
  maxAttempts: number;
  failedLabel: string;
}

export type AgentLabel = "billing" | "technical" | "academic" | "account" | "other";

export interface AgentConversation {
  id: string;
  label: AgentLabel;
  audience: "student" | "parent";
  /** 1 = first-line assistant, 2 = escalated agent with tools. */
  level: 1 | 2;
  status: "open" | "resolved" | "escalated";
  startedLabel: string;
  messageCount: number;
  toolCalls: string[];
  /** Cost of the AI calls in rupiah. */
  costIdr: number;
}

export interface AiCostDay {
  /** Short display label such as "Rab 7 Okt". */
  dayLabel: string;
  costIdr: number;
  calls: number;
}

export type ItemStatus = "draft" | "review" | "published" | "retired";

export interface ItemOption {
  id: string;
  label: string;
  text: string;
  /** Hint shown when a student picks this wrong option; required for every distractor. */
  hint?: string;
}

export interface ItemStats {
  attempts: number;
  /** Share of attempts answered correctly, 0-1. */
  correctRate: number;
  /** Hint reports filed against this item. */
  reportCount: number;
}

/** An item as the admin sees it: the `items` table plus its usage statistics. */
export interface AdminItem {
  id: string;
  code: string;
  competencyCode: string;
  competencyName: string;
  tier: QuestionTier;
  answerType: AnswerType;
  layoutMode: WorkspaceLayoutMode;
  status: ItemStatus;
  version: number;
  /** Estimated difficulty 0-1 (higher is harder). */
  difficulty: number;
  stem: string;
  formula?: string;
  options: ItemOption[];
  /** Ids of the correct options; for short answers, the accepted answer as a single entry. */
  answerKey: string[];
  /** Other spellings accepted as correct for short answers. */
  equivalents: string[];
  tolerance?: number;
  explanation: string;
  stimulusId?: string;
  media?: WorkspaceMedia;
  stimulus?: WorkspaceStimulus;
  stats: ItemStats;
}

export type ItemHealthFlag = "too_easy" | "too_hard" | "often_reported";

export interface AdminWorksheet {
  id: string;
  title: string;
  stageName: string;
  releaseLabel: string;
  status: "draft" | "published";
  /** Items per slot; a full worksheet has 4 new, 2 adaptive, and 2 spaced-review items. */
  slots: { new: number; adaptive: number; review: number };
  /** Items in the worksheet that are not published yet. */
  unpublishedItems: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "parent" | "student";
  /** Parents only. */
  subscription?: SubscriptionStatus;
  lastActiveLabel: string;
  active: boolean;
}

/** Hasil penilaian satu worksheet: skor per butir (id butir → ScoreResult) dan skor keseluruhan. */
export interface GradedWorksheetResult {
  assignmentId: string;
  overallScore: number;
  results: Record<string, import("@coreta/scoring").ScoreResult>;
  completedAt: number;
  durationSeconds: number;
}

/**
 * Penilai worksheet untuk ruang kerja. Ruang kerja asli memakai server action (kunci jawaban
 * hanya di server); galeri dan tes memakai penilai tiruan di lib/mock/api.ts.
 */
export type WorksheetGrader = (input: {
  assignmentId: string;
  answers: Record<string, import("@coreta/scoring").Answer>;
  questionIds: readonly string[];
  elapsedSeconds: number;
}) => Promise<GradedWorksheetResult>;
