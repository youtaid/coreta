import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { answersSchema, gradeItems, type ItemKeyRow, toScoringItem } from "./grading";

interface SeedItem {
  code: string;
  answer_type: string;
  options?: { id: string }[];
  answer_key: string[];
  equivalents?: string[];
  tolerance?: number;
  distractor_hints?: Record<string, string>;
  status: string;
}

const seed = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../../../packages/content/seed/items.json", import.meta.url)),
    "utf8",
  ),
) as { items: SeedItem[] };

// Baris `items` seperti yang dibaca server dari Supabase.
const rows: ItemKeyRow[] = seed.items
  .filter((item) => item.status === "published")
  .map((item) => ({
    id: item.code,
    answer_type: item.answer_type,
    options: item.options ?? [],
    answer_key: item.answer_key,
    equivalents: item.equivalents ?? [],
    tolerance: item.tolerance ?? null,
    distractor_hints: item.distractor_hints ?? {},
  }));

function correctAnswer(row: ItemKeyRow) {
  const keys = row.answer_key as string[];
  const options = row.options as { id: string }[];
  switch (row.answer_type) {
    case "pg":
      return { type: "pg" as const, choice: keys[0] };
    case "pgk":
      return { type: "pgk" as const, choices: keys };
    case "bs":
      return {
        type: "bs" as const,
        rows: Object.fromEntries(options.map((option) => [option.id, keys.includes(option.id)])),
      };
    default:
      return { type: "isian" as const, text: keys[0] };
  }
}

describe("penilaian server dengan butir seed", () => {
  it("8 butir terbit; jawaban sesuai kunci = skor 1 untuk semua", () => {
    expect(rows).toHaveLength(8);
    const answers = Object.fromEntries(rows.map((row) => [row.id, correctAnswer(row)]));
    const graded = gradeItems(rows, answers);
    expect(graded.overallScore).toBe(1);
    expect(Object.values(graded.results).every((result) => result.correct)).toBe(true);
  });

  it("pengecoh PG = 0 dengan petunjuknya; tanpa jawaban atau tipe salah = 0", () => {
    const pg = rows.find((row) => row.answer_type === "pg" && row.id === "MAT-SMA-ALJ-01")!;
    const graded = gradeItems([pg, rows[1]!], {
      [pg.id]: { type: "pg", choice: "b" },
      [rows[1]!.id]: { type: "isian", text: "1" },
    });
    expect(graded.results[pg.id]).toMatchObject({ score: 0, correct: false });
    expect(graded.results[pg.id]?.hints[0]?.text).toContain("tanda pertidaksamaan");
    expect(graded.results[rows[1]!.id]?.score).toBe(0);
    expect(graded.overallScore).toBe(0);
  });

  it("aturan 8: PGK dengan semua opsi dicentang bernilai 0", () => {
    const pgk = rows.find((row) => row.answer_type === "pgk")!;
    const all = (pgk.options as { id: string }[]).map((option) => option.id);
    expect(gradeItems([pgk], { [pgk.id]: { type: "pgk", choices: all } }).overallScore).toBe(0);
  });

  it("isian menerima penulisan setara (Rp60.000)", () => {
    const isian = rows.find((row) => row.answer_type === "isian")!;
    expect(
      gradeItems([isian], { [isian.id]: { type: "isian", text: "Rp60.000" } }).overallScore,
    ).toBe(1);
  });

  it("BS dipetakan per pernyataan", () => {
    const bs = rows.find((row) => row.answer_type === "bs")!;
    const item = toScoringItem(bs);
    expect(item.type).toBe("bs");
    expect(item.type === "bs" && item.rows.map((row) => row.key)).toEqual([
      true,
      false,
      true,
      false,
    ]);
  });

  it("NEGATIF: bentuk jawaban dari browser divalidasi", () => {
    expect(answersSchema.safeParse({ x: { type: "pg", choice: "a" } }).success).toBe(true);
    expect(answersSchema.safeParse({ x: { type: "pg", choice: { $ne: 1 } } }).success).toBe(false);
    expect(answersSchema.safeParse({ x: { type: "lain" } }).success).toBe(false);
    expect(answersSchema.safeParse({ x: { type: "isian", text: "9".repeat(500) } }).success).toBe(
      false,
    );
  });

  it("NEGATIF: tipe jawaban yang tidak dikenal di basis data ditolak", () => {
    expect(() => toScoringItem({ ...rows[0]!, answer_type: "esai" })).toThrow();
  });
});
