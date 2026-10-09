import type { BsAnswer, BsItem, Hint, ScoreResult } from "./types";

/**
 * Scores a true/false item: the number of rows marked correctly divided by the number of rows,
 * so 3 of 4 correct is 0.75. A row left unanswered counts as wrong but gets no hint, because the
 * student made no mark to explain. Each row marked wrongly returns its hint, if it has one.
 *
 * Throws when the item has no rows or repeats a row id, since either is a content error.
 */
export function scoreBs(item: BsItem, answer: BsAnswer): ScoreResult {
  if (item.rows.length === 0) {
    throw new Error("Butir benar-salah tidak valid: tidak ada baris pernyataan.");
  }
  if (new Set(item.rows.map((row) => row.id)).size !== item.rows.length) {
    throw new Error("Butir benar-salah tidak valid: id baris tidak boleh kembar.");
  }

  let correctRows = 0;
  const hints: Hint[] = [];

  for (const row of item.rows) {
    const mark = answer.rows[row.id];
    if (mark === row.key) {
      correctRows += 1;
    } else if (typeof mark === "boolean" && row.hint) {
      hints.push({ targetId: row.id, text: row.hint });
    }
  }

  const score = correctRows / item.rows.length;
  return { score, correct: correctRows === item.rows.length, hints };
}
