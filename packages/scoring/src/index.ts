import { scoreBs } from "./bs";
import { scoreIsian } from "./isian";
import { scorePg } from "./pg";
import { scorePgk } from "./pgk";
import type { Answer, Item, ScoreResult } from "./types";

export { scoreBs } from "./bs";
export { normalizeAnswer, REGISTERED_UNITS, scoreIsian } from "./isian";
export {
  composeWorksheet,
  DEFAULT_TARGET_ADAPTIF,
  DEFAULT_TARGET_BARU,
  DEFAULT_TARGET_REVIEW,
  getItemId,
  WORKSHEET_SIZE,
} from "./compose";
export type {
  CompetencyCandidatePool,
  ComposedWorksheet,
  ComposeWorksheetOptions,
  WorksheetCategory,
  WorksheetSlot,
} from "./compose";
export {
  applyReview,
  computeMastery,
  initialMasteryState,
  isReviewDue,
  MASTER_MIN_ATTEMPTS,
  MASTER_SCORE,
  REVIEW_INTERVAL_DAYS,
  REVOKE_BELOW,
  SCORE_WINDOW,
  TIERS,
  UNLOCK_MIN_ATTEMPTS,
  UNLOCK_SCORE,
} from "./mastery";
export type { MasteryResult, MasteryState, Tier, TierAttempt, TierSummary } from "./mastery";
export { scorePg } from "./pg";
export { PGK_INCOMPLETE_HINT, PGK_SELECT_ALL_HINT, scorePgk } from "./pgk";
export type {
  Answer,
  AnswerType,
  BsAnswer,
  BsItem,
  BsRow,
  ChoiceOption,
  Hint,
  IsianAnswer,
  IsianItem,
  Item,
  PgAnswer,
  PgItem,
  PgkAnswer,
  PgkItem,
  ScoreResult,
} from "./types";

export function scoringPlaceholder(): "scoring ready" {
  return "scoring ready";
}

/**
 * Scores one answer against its item. Pure: the result depends only on the arguments, with no
 * network, clock, or randomness, and the inputs are never modified.
 *
 * An answer of a different type than the item (say a true/false answer sent for a pg item) is
 * invalid input rather than a wrong answer, so it scores 0 with no hints.
 */
export function scoreItem(item: Item, answer: Answer): ScoreResult {
  switch (item.type) {
    case "pg":
      return answer.type === "pg" ? scorePg(item, answer) : invalidAnswer();
    case "pgk":
      return answer.type === "pgk" ? scorePgk(item, answer) : invalidAnswer();
    case "bs":
      return answer.type === "bs" ? scoreBs(item, answer) : invalidAnswer();
    case "isian":
      return answer.type === "isian" ? scoreIsian(item, answer) : invalidAnswer();
    default: {
      const unreachable: never = item;
      throw new Error(`Jenis butir belum didukung: ${JSON.stringify(unreachable)}`);
    }
  }
}

function invalidAnswer(): ScoreResult {
  return { score: 0, correct: false, hints: [] };
}
