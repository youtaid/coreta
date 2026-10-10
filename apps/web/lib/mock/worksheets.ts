import type {
  QuestionOutcome,
  ResultQuestion,
  WorksheetResult,
  WorksheetStatus,
  WorksheetSummary,
} from "@/lib/domain";

export interface WorksheetGroup {
  key: "this_week" | "spaced_review" | "completed";
  title: string;
  description: string;
  items: WorksheetSummary[];
}

const groupDefinitions: {
  key: WorksheetGroup["key"];
  title: string;
  description: string;
  statuses: WorksheetStatus[];
}[] = [
  {
    key: "this_week",
    title: "Minggu ini",
    description: "Worksheet baru dan yang sedang kamu kerjakan.",
    statuses: ["new", "in_progress"],
  },
  {
    key: "spaced_review",
    title: "Ulang berjarak",
    description: "Soal lama yang waktunya diulang supaya tidak lupa.",
    statuses: ["review"],
  },
  {
    key: "completed",
    title: "Selesai",
    description: "Buka lagi untuk melihat skor dan pembahasan.",
    statuses: ["completed"],
  },
];

/** Splits worksheets into the three list sections; empty sections are dropped. */
export function groupWorksheets(items: readonly WorksheetSummary[]): WorksheetGroup[] {
  return groupDefinitions
    .map(({ statuses, ...group }) => ({
      ...group,
      items: items.filter((item) => statuses.includes(item.status)),
    }))
    .filter((group) => group.items.length > 0);
}

export const STAGE_PARAM = "tahap";

/** `?tahap=3` → 3. Anything that is not a whole number 0-8 means "no filter". */
export function parseStageFilter(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^\d$/.test(value)) return null;
  const stage = Number(value);
  return stage <= 8 ? stage : null;
}

/**
 * Stage chips for the list: every stage that has a worksheet, plus the selected one so the
 * student still sees which filter is on when it matches nothing.
 */
export function stageFilterOptions(
  items: readonly Pick<WorksheetSummary, "stageNumber">[],
  selected: number | null,
): number[] {
  const stages = new Set(items.map((item) => item.stageNumber));
  if (selected !== null) stages.add(selected);
  return [...stages].sort((a, b) => a - b);
}

export function filterByStage<T extends Pick<WorksheetSummary, "stageNumber">>(
  items: readonly T[],
  stage: number | null,
): T[] {
  return stage === null ? [...items] : items.filter((item) => item.stageNumber === stage);
}

export function stageFilterHref(stage: number | null): string {
  return stage === null ? "/belajar/worksheet" : `/belajar/worksheet?${STAGE_PARAM}=${stage}`;
}

/** Result page for completed worksheets, workspace for everything else. */
export function worksheetHref(worksheet: Pick<WorksheetSummary, "id" | "status">): string {
  return worksheet.status === "completed"
    ? `/belajar/hasil/${worksheet.id}`
    : `/belajar/kerjakan/${worksheet.id}`;
}

export function countOutcomes(
  questions: readonly ResultQuestion[],
): Record<QuestionOutcome, number> {
  const counts: Record<QuestionOutcome, number> = { correct: 0, partial: 0, incorrect: 0 };
  for (const question of questions) counts[question.outcome] += 1;
  return counts;
}

const functionLinearQuestions: ResultQuestion[] = [
  {
    number: 1,
    prompt: "Tentukan gradien garis yang melalui titik (1, 3) dan (4, 12).",
    studentAnswer: "3",
    correctAnswer: "3",
    outcome: "correct",
    points: 1,
    maxPoints: 1,
    explanation: "Gradien m = (y₂ − y₁) / (x₂ − x₁) = (12 − 3) / (4 − 1) = 9 / 3 = 3.",
    hintsUsed: 0,
  },
  {
    number: 2,
    prompt: "Jika f(x) = 2x − 5, berapakah f(4)?",
    studentAnswer: "3",
    correctAnswer: "3",
    outcome: "correct",
    points: 1,
    maxPoints: 1,
    explanation: "Substitusikan x = 4: f(4) = 2(4) − 5 = 8 − 5 = 3.",
    hintsUsed: 0,
  },
  {
    number: 3,
    prompt: "Titik potong grafik y = 3x − 6 dengan sumbu-x adalah ….",
    studentAnswer: "(0, −6)",
    correctAnswer: "(2, 0)",
    outcome: "incorrect",
    points: 0,
    maxPoints: 1,
    explanation:
      "Titik potong sumbu-x terjadi saat y = 0. Maka 3x − 6 = 0, sehingga x = 2. Titiknya (2, 0). Titik (0, −6) adalah titik potong sumbu-y.",
    hintsUsed: 1,
  },
  {
    number: 4,
    prompt:
      "Pilih semua pernyataan yang benar tentang fungsi f(x) = −2x + 1: (A) gradien −2, (B) memotong sumbu-y di (0, 1), (C) grafik naik, (D) f(0) = 1.",
    studentAnswer: "A, B",
    correctAnswer: "A, B, D",
    outcome: "partial",
    points: 0.5,
    maxPoints: 1,
    explanation:
      "Gradien −2 (A benar) dan f(0) = 1 sehingga memotong sumbu-y di (0, 1) (B dan D benar). Karena gradien negatif, grafik turun (C salah). Kamu melewatkan D.",
    hintsUsed: 0,
  },
  {
    number: 5,
    prompt: "Persamaan garis dengan gradien 2 yang melalui titik (0, 4) adalah ….",
    studentAnswer: "y = 2x + 4",
    correctAnswer: "y = 2x + 4",
    outcome: "correct",
    points: 1,
    maxPoints: 1,
    explanation: "Bentuk y = mx + c dengan m = 2 dan c = 4 (titik potong sumbu-y).",
    hintsUsed: 0,
  },
  {
    number: 6,
    prompt: "Garis y = 4x + 1 sejajar dengan garis y = 4x − 7. Benar atau salah?",
    studentAnswer: "Benar",
    correctAnswer: "Benar",
    outcome: "correct",
    points: 1,
    maxPoints: 1,
    explanation: "Dua garis sejajar jika gradiennya sama. Keduanya bergradien 4.",
    hintsUsed: 0,
  },
  {
    number: 7,
    prompt: "Jika f(x) = 5 − x, tentukan nilai x agar f(x) = −3.",
    studentAnswer: "8",
    correctAnswer: "8",
    outcome: "correct",
    points: 1,
    maxPoints: 1,
    explanation: "5 − x = −3, maka x = 5 + 3 = 8.",
    hintsUsed: 0,
  },
  {
    number: 8,
    prompt: "Gradien garis 2x + 4y = 8 adalah ….",
    studentAnswer: "−1/2",
    correctAnswer: "−1/2",
    outcome: "correct",
    points: 1,
    maxPoints: 1,
    explanation: "Ubah ke bentuk y = mx + c: 4y = −2x + 8, y = −½x + 2. Gradiennya −1/2.",
    hintsUsed: 0,
  },
];

const results: WorksheetResult[] = [
  {
    assignmentId: "ws-mock-201",
    title: "Fungsi Linear & Grafik",
    stageName: "Tahap 2 · Fungsi",
    score: 0.8125,
    durationMinutes: 22,
    questions: functionLinearQuestions,
  },
];

// Placeholder screens from the earlier phase link to this id.
const resultAliases: Record<string, string> = { "demo-assignment": "ws-mock-201" };

export function getWorksheetResult(assignmentId: string): WorksheetResult | undefined {
  const id = resultAliases[assignmentId] ?? assignmentId;
  return results.find((result) => result.assignmentId === id);
}
