import type { Hint, PgkAnswer, PgkItem, ScoreResult } from "./types";

/** Shown when every option is ticked; ticking everything is always scored 0 (rule 8). */
export const PGK_SELECT_ALL_HINT =
  "Mencentang semua pilihan dihitung salah. Pilih hanya pernyataan yang kamu yakini benar.";

/** Shown whenever the score is below 1, since some keys were not ticked. */
export const PGK_INCOMPLETE_HINT = "Masih ada pilihan benar yang belum dipilih.";

/**
 * Scores a complex multiple-choice item: the number of keys ticked divided by the number of keys.
 * Wrong ticks do not lower the score, so 2 of 3 keys is 0.67 whether or not a wrong option was
 * also ticked.
 *
 * The safeguard runs first: if every option is ticked the score is 0 and the only hint returned is
 * PGK_SELECT_ALL_HINT, no matter how many keys that would have covered. Otherwise the result has
 * one hint per wrong option that was ticked and has hint text (in item order), then
 * PGK_INCOMPLETE_HINT when the score is below 1, which includes ticking nothing.
 *
 * Throws when the item is malformed: no keys, repeated option ids or keys, a key that is not an
 * option, or every option being a key (the safeguard would make the item impossible to pass).
 */
export function scorePgk(item: PgkItem, answer: PgkAnswer): ScoreResult {
  const optionIds = new Set(item.options.map((option) => option.id));
  if (optionIds.size !== item.options.length) {
    throw new Error("Butir PG kompleks tidak valid: id opsi tidak boleh kembar.");
  }
  const keys = new Set(item.keys);
  if (keys.size === 0 || keys.size !== item.keys.length) {
    throw new Error("Butir PG kompleks tidak valid: kunci kosong atau kembar.");
  }
  for (const key of keys) {
    if (!optionIds.has(key)) {
      throw new Error(`Butir PG kompleks tidak valid: kunci "${key}" bukan salah satu opsi.`);
    }
  }
  if (keys.size === optionIds.size) {
    throw new Error("Butir PG kompleks tidak valid: semua opsi tidak boleh menjadi kunci.");
  }

  // Ignore ids that are not options, and repeated ids.
  const ticked = new Set(answer.choices.filter((id) => optionIds.has(id)));

  if (ticked.size === optionIds.size) {
    return { score: 0, correct: false, hints: [{ text: PGK_SELECT_ALL_HINT }] };
  }

  let keysTicked = 0;
  const hints: Hint[] = [];
  for (const option of item.options) {
    if (!ticked.has(option.id)) continue;
    if (keys.has(option.id)) {
      keysTicked += 1;
    } else if (option.hint) {
      hints.push({ targetId: option.id, text: option.hint });
    }
  }

  const score = keysTicked / keys.size;
  if (score < 1) hints.push({ text: PGK_INCOMPLETE_HINT });
  return { score, correct: score === 1, hints };
}
