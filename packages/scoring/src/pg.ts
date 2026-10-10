import type { PgAnswer, PgItem, ScoreResult } from "./types";

/**
 * Scores a single-answer multiple-choice item: 1 when the chosen option is the key, otherwise 0.
 * A wrong choice returns that option's hint, if it has one. No choice, or an id that is not one
 * of the options, scores 0 and returns no hint, since there is no wrong option to explain.
 *
 * Throws when the item itself is malformed (its key is not among its options), because that is a
 * content error, not a wrong answer.
 */
export function scorePg(item: PgItem, answer: PgAnswer): ScoreResult {
  if (!item.options.some((option) => option.id === item.key)) {
    throw new Error(`Butir PG tidak valid: kunci "${item.key}" bukan salah satu opsi.`);
  }

  const choice = answer.choice;
  if (choice === item.key) return { score: 1, correct: true, hints: [] };

  const chosen = item.options.find((option) => option.id === choice);
  const hints = chosen?.hint ? [{ targetId: chosen.id, text: chosen.hint }] : [];
  return { score: 0, correct: false, hints };
}
