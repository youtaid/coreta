// Scoring input and output shapes. Everything here is plain data so the same functions can run in
// the web server, the worker, and tests. Items carry the answer key, so they must never be sent to
// the browser (rule 1); only `ScoreResult.hints` and `score` are returned after submission.

export type AnswerType = "pg" | "pgk" | "bs" | "isian";

/** A multiple-choice option. `hint` is shown when a student picks this wrong option. */
export interface ChoiceOption {
  id: string;
  hint?: string;
}

/** Single-answer multiple choice: exactly one option is the key. */
export interface PgItem {
  type: "pg";
  options: readonly ChoiceOption[];
  /** Id of the correct option. */
  key: string;
}

/** One statement in a true/false item. `hint` is shown when the student marks it wrongly. */
export interface BsRow {
  id: string;
  /** Whether the statement is actually true. */
  key: boolean;
  hint?: string;
}

/** True/false item: every statement is marked true or false on its own. */
export interface BsItem {
  type: "bs";
  rows: readonly BsRow[];
}

/**
 * Complex multiple choice: several options are keys and the student ticks every one they believe
 * is true. Wrong ticks never lower the score, so ticking everything is blocked by a safeguard.
 */
export interface PgkItem {
  type: "pgk";
  options: readonly ChoiceOption[];
  /** Ids of the correct options; at least one, and never every option. */
  keys: readonly string[];
}

/**
 * Short answer: the student types a number, compared numerically with the key. The key and the
 * equivalents are written the way a student might write them ("60000", "Rp60.000", "3/4").
 */
export interface IsianItem {
  type: "isian";
  key: string;
  /** Other accepted spellings, compared as numbers when numeric and as text otherwise. */
  equivalents?: readonly string[];
  /** Largest difference from the key still scored correct; 0 when absent. */
  tolerance?: number;
}

export type Item = PgItem | PgkItem | BsItem | IsianItem;

export interface PgAnswer {
  type: "pg";
  /** Id of the chosen option; null or undefined when nothing was chosen. */
  choice?: string | null;
}

export interface BsAnswer {
  type: "bs";
  /** Row id to the student's mark; rows left out or null were not answered. */
  rows: Readonly<Record<string, boolean | null | undefined>>;
}

export interface PgkAnswer {
  type: "pgk";
  /** Ids of the ticked options; ids that are not options are ignored. */
  choices: readonly string[];
}

export interface IsianAnswer {
  type: "isian";
  /** What the student typed; null or undefined when left blank. */
  text?: string | null;
}

export type Answer = PgAnswer | PgkAnswer | BsAnswer | IsianAnswer;

/** A hint about one wrong option or row, or about the answer as a whole. */
export interface Hint {
  /** Id of the option (pg, pgk) or row (bs) the hint is about; absent for hints on the whole answer. */
  targetId?: string;
  text: string;
}

export interface ScoreResult {
  /** Fraction of the item answered correctly, from 0 to 1. Not rounded. */
  score: number;
  /** True only when the score is exactly 1. */
  correct: boolean;
  /** One hint per wrong option or row that has hint text, in item order. */
  hints: Hint[];
}
