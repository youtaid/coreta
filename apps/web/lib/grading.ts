// Penilaian worksheet dengan @coreta/scoring (aturan 2). Fungsi murni: menerima baris `items`
// lengkap (dengan kunci) yang hanya dibaca server, dan jawaban dari browser.

import { type Answer, type Item, type ScoreResult, scoreItem } from "@coreta/scoring";
import { z } from "zod";

/** Kolom `items` yang dibutuhkan penilaian. Tidak pernah dikirim ke browser (aturan 1). */
export interface ItemKeyRow {
  id: string;
  answer_type: string;
  options: unknown;
  answer_key: unknown;
  equivalents: unknown;
  tolerance: number | null;
  distractor_hints: unknown;
}

const strings = z.array(z.string());
const optionIds = z.array(z.object({ id: z.string() }));
const hints = z.record(z.string(), z.string());

export function toScoringItem(row: ItemKeyRow): Item {
  const keys = strings.parse(row.answer_key);
  const options = optionIds.safeParse(row.options).data ?? [];
  const hintFor = hints.safeParse(row.distractor_hints).data ?? {};
  const withHints = options.map((option) => ({ id: option.id, hint: hintFor[option.id] }));

  switch (row.answer_type) {
    case "pg":
      return { type: "pg", key: keys[0] ?? "", options: withHints };
    case "pgk":
      return { type: "pgk", keys, options: withHints };
    case "bs":
      return {
        type: "bs",
        rows: withHints.map((option) => ({ ...option, key: keys.includes(option.id) })),
      };
    case "isian":
      return {
        type: "isian",
        key: keys[0] ?? "",
        equivalents: strings.safeParse(row.equivalents).data ?? [],
        ...(row.tolerance !== null && { tolerance: Number(row.tolerance) }),
      };
    default:
      throw new Error(`Tipe jawaban tidak dikenal: ${row.answer_type}`);
  }
}

/** Jawaban dari browser divalidasi dulu: bentuknya harus sama dengan Answer di @coreta/scoring. */
export const answerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pg"), choice: z.string().max(64).nullish() }),
  z.object({ type: z.literal("pgk"), choices: z.array(z.string().max(64)).max(20) }),
  z.object({
    type: z.literal("bs"),
    rows: z.record(z.string().max(64), z.boolean().nullish()),
  }),
  z.object({ type: z.literal("isian"), text: z.string().max(200).nullish() }),
]);

export const answersSchema = z.record(z.string(), answerSchema);

export interface GradedItems {
  results: Record<string, ScoreResult>;
  overallScore: number;
}

/**
 * Nilai setiap butir dalam urutan worksheet. Butir yang tidak dijawab, atau dijawab dengan tipe
 * yang salah, bernilai 0.
 */
export function gradeItems(
  items: readonly ItemKeyRow[],
  answers: Readonly<Record<string, Answer>>,
): GradedItems {
  const results: Record<string, ScoreResult> = {};
  let total = 0;
  for (const row of items) {
    const answer = answers[row.id];
    const result =
      answer && answer.type === row.answer_type
        ? scoreItem(toScoringItem(row), answer)
        : { score: 0, correct: false, hints: [] };
    results[row.id] = result;
    total += result.score;
  }
  return {
    results,
    overallScore: items.length === 0 ? 0 : Number((total / items.length).toFixed(4)),
  };
}
