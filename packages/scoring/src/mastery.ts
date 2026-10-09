// Mastery model v1: how a student's first attempts open the next tier, earn "tuntas" for a
// competency, and schedule spaced review. Pure functions: the current time is always a parameter
// (`now`, in milliseconds), nothing here reads a clock, and no input is modified.

export type Tier = "dasar" | "mahir" | "ujian";

/** Tiers from easiest to hardest; passing one opens the next. */
export const TIERS: readonly Tier[] = ["dasar", "mahir", "ujian"];

/** How many of the latest first attempts make up a tier's score. */
export const SCORE_WINDOW = 10;

/** A tier opens the next one at this score, given at least UNLOCK_MIN first attempts. */
export const UNLOCK_SCORE = 0.7;
export const UNLOCK_MIN_ATTEMPTS = 5;

/** A competency is mastered at this ujian-tier score, given at least MASTER_MIN first attempts. */
export const MASTER_SCORE = 0.8;
export const MASTER_MIN_ATTEMPTS = 8;

/** A review round scoring below this revokes mastery. */
export const REVOKE_BELOW = 0.6;

/** Days until the next spaced review: after mastery, then after each successful review. */
export const REVIEW_INTERVAL_DAYS: readonly number[] = [3, 7, 14, 30];

const DAY_MS = 86_400_000;

/** Absorbs floating-point noise when a mean lands exactly on a threshold. */
const EPSILON = 1e-9;
const atLeast = (value: number, threshold: number) => value + EPSILON >= threshold;

/** One submitted attempt. Only the first attempt on each item counts toward a tier score. */
export interface TierAttempt {
  itemId: string;
  tier: Tier;
  /** Score from 0 to 1. */
  score: number;
  /** When the attempt was submitted, in milliseconds. */
  submittedAt: number;
}

export interface TierSummary {
  tier: Tier;
  /** Mean of the latest SCORE_WINDOW first attempts at this tier; 0 when there are none. */
  score: number;
  /** Number of first attempts at this tier (not limited to the window). */
  attempts: number;
  unlocked: boolean;
}

/** What is remembered between calculations (the `mastery` table plus review bookkeeping). */
export interface MasteryState {
  /** Tiers opened so far. A tier stays open even if its predecessor's score later dips. */
  unlocked: readonly Tier[];
  /** When the competency became mastered; null when it is not mastered. */
  masteredAt: number | null;
  /** When mastery was revoked; only ujian attempts after this moment can earn it back. */
  revokedAt: number | null;
  /** Position in REVIEW_INTERVAL_DAYS of the review that is currently scheduled. */
  reviewStep: number;
  /** When the next spaced review falls due; null when the competency is not mastered. */
  nextReviewAt: number | null;
}

export const initialMasteryState: MasteryState = {
  unlocked: ["dasar"],
  masteredAt: null,
  revokedAt: null,
  reviewStep: 0,
  nextReviewAt: null,
};

export interface MasteryResult {
  tiers: Record<Tier, TierSummary>;
  state: MasteryState;
  mastered: boolean;
  /** True when this calculation is the one that earned mastery. */
  newlyMastered: boolean;
}

function validate(attempts: readonly TierAttempt[]): void {
  for (const attempt of attempts) {
    if (!TIERS.includes(attempt.tier)) {
      throw new Error(`Tingkat tidak dikenal: "${attempt.tier}".`);
    }
    if (!Number.isFinite(attempt.score) || attempt.score < 0 || attempt.score > 1) {
      throw new Error(`Skor percobaan harus antara 0 dan 1, bukan ${attempt.score}.`);
    }
    if (!Number.isFinite(attempt.submittedAt)) {
      throw new Error("Waktu percobaan harus berupa angka.");
    }
  }
}

/** The earliest attempt on each item; later attempts on the same item never count. */
function firstAttempts(attempts: readonly TierAttempt[]): TierAttempt[] {
  const first = new Map<string, TierAttempt>();
  for (const attempt of attempts) {
    const seen = first.get(attempt.itemId);
    // `<` keeps the earlier entry when two attempts share a timestamp.
    if (!seen || attempt.submittedAt < seen.submittedAt) first.set(attempt.itemId, attempt);
  }
  return [...first.values()];
}

function summarize(attempts: readonly TierAttempt[]): { score: number; count: number } {
  // Stable sort by time: ties keep input order.
  const ordered = [...attempts].sort((a, b) => a.submittedAt - b.submittedAt);
  const window = ordered.slice(-SCORE_WINDOW);
  if (window.length === 0) return { score: 0, count: ordered.length };
  const total = window.reduce((sum, attempt) => sum + attempt.score, 0);
  return { score: total / window.length, count: ordered.length };
}

function meetsUnlock(summary: { score: number; count: number }): boolean {
  return summary.count >= UNLOCK_MIN_ATTEMPTS && atLeast(summary.score, UNLOCK_SCORE);
}

/**
 * Works out each tier's score and which tiers are open, and whether the competency is now
 * mastered, from every attempt the student has made on it.
 *
 * - Only the first attempt on each item counts, so retrying an item never raises a score.
 * - A tier's score is the mean of its latest 10 first attempts.
 * - A tier opens the next at 70% with at least 5 first attempts, and stays open afterwards.
 * - The competency is mastered at an ujian score of 80% with at least 8 first attempts. After
 *   mastery is revoked, only ujian attempts submitted later can earn it back.
 * - Once mastered, it stays mastered here; only `applyReview` can revoke it.
 *
 * `previous` is the state returned last time (omit it for a new competency).
 */
export function computeMastery(
  attempts: readonly TierAttempt[],
  now: number,
  previous: MasteryState = initialMasteryState,
): MasteryResult {
  validate(attempts);
  const first = firstAttempts(attempts);

  // Tier summaries and unlocking always use every first attempt.
  const shown = {} as Record<Tier, { score: number; count: number }>;
  for (const tier of TIERS) shown[tier] = summarize(first.filter((a) => a.tier === tier));

  // Mastery evidence must be newer than a revocation.
  const revokedAt = previous.revokedAt;
  const evidence = summarize(
    first.filter((a) => a.tier === "ujian" && (revokedAt === null || a.submittedAt > revokedAt)),
  );

  const unlocked = new Set<Tier>([...previous.unlocked, "dasar"]);
  for (let index = 0; index < TIERS.length - 1; index += 1) {
    const tier = TIERS[index] as Tier;
    const next = TIERS[index + 1] as Tier;
    if (unlocked.has(tier) && meetsUnlock(shown[tier])) unlocked.add(next);
  }

  const tiers = {} as Record<Tier, TierSummary>;
  for (const tier of TIERS) {
    tiers[tier] = {
      tier,
      score: shown[tier].score,
      attempts: shown[tier].count,
      unlocked: unlocked.has(tier),
    };
  }

  let { masteredAt, reviewStep, nextReviewAt } = previous;
  let newlyMastered = false;
  if (masteredAt === null) {
    if (
      unlocked.has("ujian") &&
      evidence.count >= MASTER_MIN_ATTEMPTS &&
      atLeast(evidence.score, MASTER_SCORE)
    ) {
      masteredAt = now;
      reviewStep = 0;
      nextReviewAt = now + (REVIEW_INTERVAL_DAYS[0] ?? 3) * DAY_MS;
      newlyMastered = true;
    }
  }

  return {
    tiers,
    state: {
      unlocked: TIERS.filter((tier) => unlocked.has(tier)),
      masteredAt,
      revokedAt: previous.revokedAt,
      reviewStep,
      nextReviewAt,
    },
    mastered: masteredAt !== null,
    newlyMastered,
  };
}

/** Whether a mastered competency is due for its spaced review at `now`. */
export function isReviewDue(state: MasteryState, now: number): boolean {
  return state.masteredAt !== null && state.nextReviewAt !== null && now >= state.nextReviewAt;
}

/**
 * Applies one round of spaced review to a mastered competency. `scores` are the scores (0 to 1)
 * of the review items answered in that round; their mean decides the outcome:
 *
 * - below 60%: mastery is revoked and nothing is scheduled;
 * - 80% or more ("benar"): the next review moves one step further out, 3 → 7 → 14 → 30 days,
 *   and stays at 30 days after that;
 * - from 60% up to 80% ("salah"): mastery stays but the schedule goes back to 3 days.
 *
 * An empty round, or a competency that is not mastered, changes nothing.
 */
export function applyReview(
  state: MasteryState,
  scores: readonly number[],
  now: number,
): MasteryState {
  if (state.masteredAt === null || scores.length === 0) return state;
  for (const score of scores) {
    if (!Number.isFinite(score) || score < 0 || score > 1) {
      throw new Error(`Skor ulangan harus antara 0 dan 1, bukan ${score}.`);
    }
  }

  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  if (!atLeast(mean, REVOKE_BELOW)) {
    return { ...state, masteredAt: null, revokedAt: now, reviewStep: 0, nextReviewAt: null };
  }

  const step = atLeast(mean, MASTER_SCORE)
    ? Math.min(state.reviewStep + 1, REVIEW_INTERVAL_DAYS.length - 1)
    : 0;
  const days = REVIEW_INTERVAL_DAYS[step] ?? 3;
  return { ...state, reviewStep: step, nextReviewAt: now + days * DAY_MS };
}
