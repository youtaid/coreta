// Mock API for Workspace Scoring (Fase 28).
// Connects workspace submissions to `@coreta/scoring`.
//
// In v1 client-mock mode (temporary until database auth & Fase 38),
// answer keys live here so student submissions can be graded instantly
// with hints and score calculations.

import {
  scoreItem,
  type Answer,
  type BsItem,
  type IsianItem,
  type Item,
  type PgItem,
  type PgkItem,
  type ScoreResult,
} from "@coreta/scoring";

/** Mock answer keys and hints for the 8 standard mock questions. */
export const mockScoringKeys: Record<string, Item> = {
  // Soal 1 (PG): Fungsi Kuadrat
  "item-math-01": {
    type: "pg",
    key: "opt-1-a",
    options: [
      { id: "opt-1-a" },
      { id: "opt-1-b", hint: "Perhatikan tanda pertidaksamaan: -8k > -24 menghasilkan k < 3, bukan k > 3." },
      { id: "opt-1-c", hint: "Periksa kembali pembagian dengan bilangan negatif." },
      { id: "opt-1-d", hint: "Syarat grafik memotong sumbu-X di dua titik berbeda adalah D > 0 (bukan ≥ 0)." },
      { id: "opt-1-e", hint: "Determinan harus bernilai positif murni agar terdapat dua akar real berlainan." },
    ],
  } satisfies PgItem,

  // Soal 2 (PG): Parabola & Geometri
  "item-math-02": {
    type: "pg",
    key: "opt-2-a",
    options: [
      { id: "opt-2-a" },
      { id: "opt-2-b", hint: "Konstanta c harus positif karena memotong sumbu-Y di titik (0, 3)." },
      { id: "opt-2-c", hint: "Nilai a = 1 karena titik puncak minimum bernilai -1 saat x = 2." },
      { id: "opt-2-d", hint: "Sumbu simetri berada pada x = -b/(2a) = 2, sehingga koefisien b harus negatif (-4)." },
      { id: "opt-2-e", hint: "Bentuk puncak adalah f(x) = (x - 2)² - 1, bukan + 1." },
    ],
  } satisfies PgItem,

  // Soal 3 (PG): Literasi Numerasi
  "item-math-03": {
    type: "pg",
    key: "opt-3-a",
    options: [
      { id: "opt-3-a" },
      { id: "opt-3-b", hint: "Perhatikan bahwa Selendang (x) membutuhkan 3 liter pewarna, bukan 5 liter." },
      { id: "opt-3-c", hint: "Batasan kuota maksimal menggunakan tanda ≤, bukan ≥." },
      { id: "opt-3-d", hint: "Pastikan koefisien x dan y sesuai dengan sumber daya masing-masing produk." },
      { id: "opt-3-e", hint: "Kapasitas pewarna maksimal adalah 150 liter, dan waktu mesin maksimal 100 jam." },
    ],
  } satisfies PgItem,

  // Soal 4 (PGK): Aljabar Kompleks (Multi-Select)
  "item-math-04": {
    type: "pgk",
    keys: ["opt-4-a", "opt-4-c"],
    options: [
      { id: "opt-4-a" },
      { id: "opt-4-b", hint: "Grafik f(x) memotong sumbu-Y di (0, 5), bukan di (0, -5)." },
      { id: "opt-4-c" },
      { id: "opt-4-d", hint: "Nilai diskriminan D < 0, sehingga kurva tidak memiliki akar real." },
    ],
  } satisfies PgkItem,

  // Soal 5 (BS): Benar-Salah Matriks & Determinan
  "item-math-05": {
    type: "bs",
    rows: [
      { id: "row-5-1", key: true },
      { id: "row-5-2", key: false, hint: "Determinan matriks diagonal adalah perkalian elemen diagonal utamanya." },
      { id: "row-5-3", key: true },
      { id: "row-5-4", key: false, hint: "Matriks singular memiliki determinan sama dengan nol, bukan satu." },
    ],
  } satisfies BsItem,

  // Soal 6 (Isian): Isian Singkat Angka & Satuan
  "item-math-06": {
    type: "isian",
    key: "60000",
    equivalents: ["60.000", "60 ribu", "Rp60.000", "Rp 60.000", "60000 rupiah"],
    tolerance: 0,
  } satisfies IsianItem,

  // Soal 7 (PG): Geometri Ruang
  "item-math-07": {
    type: "pg",
    key: "opt-7-b",
    options: [
      { id: "opt-7-a", hint: "Jarak titik ke bidang dihitung melalui garis proyeksi tegak lurus." },
      { id: "opt-7-b" },
      { id: "opt-7-c", hint: "Gunakan rumus diagonal ruang s√3 pada kubus berusuk s." },
      { id: "opt-7-d", hint: "Periksa kembali perbandingan segitiga siku-siku penampang." },
    ],
  } satisfies PgItem,

  // Soal 8 (PGK): Statistika & Peluang
  "item-math-08": {
    type: "pgk",
    keys: ["opt-8-b", "opt-8-d"],
    options: [
      { id: "opt-8-a", hint: "Rata-rata data bertambah jika semua nilai ditambah konstanta yang sama." },
      { id: "opt-8-b" },
      { id: "opt-8-c", hint: "Standar deviasi tidak berubah saat seluruh data digeser/ditambah." },
      { id: "opt-8-d" },
    ],
  } satisfies PgkItem,
};

export interface GradedWorksheetResult {
  assignmentId: string;
  overallScore: number;
  results: Record<string, ScoreResult>;
  completedAt: number;
  durationSeconds: number;
}

/**
 * Grades a single answer against mock keys using `@coreta/scoring`.
 */
export function gradeMockQuestion(questionId: string, answer: Answer): ScoreResult {
  const itemKey = mockScoringKeys[questionId];
  if (!itemKey) {
    // If not in key bank, fallback to full score for demo safety
    return { score: 1, correct: true, hints: [] };
  }

  return scoreItem(itemKey, answer);
}

/**
 * Submits and grades all answers for an assignment.
 * Simulates async API latency (can be bypassed with delayMs = 0 in tests).
 */
export async function submitWorksheetApi(
  assignmentId: string,
  answers: Record<string, Answer>,
  questionIds: readonly string[],
  options?: { delayMs?: number; elapsedSeconds?: number },
): Promise<GradedWorksheetResult> {
  const delay = options?.delayMs ?? 300;
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  const results: Record<string, ScoreResult> = {};
  let totalScore = 0;

  for (const qId of questionIds) {
    const answer = answers[qId];
    if (!answer) {
      // Unanswered question scores 0
      results[qId] = { score: 0, correct: false, hints: [] };
    } else {
      results[qId] = gradeMockQuestion(qId, answer);
    }
    totalScore += results[qId]!.score;
  }

  const count = questionIds.length || 1;
  const overallScore = Number((totalScore / count).toFixed(4));

  return {
    assignmentId,
    overallScore,
    results,
    completedAt: Date.now(),
    durationSeconds: options?.elapsedSeconds ?? 0,
  };
}
