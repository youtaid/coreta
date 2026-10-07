// Weekly worksheet composition (Fase 24).
// A weekly worksheet consists of 8 questions:
// - 4 new questions from the active competency
// - 2 adaptive questions from the student's weakest competency (lowest score)
// - 2 spaced review questions that are due
//
// Fallback rule:
// If any category is empty or short, its unfilled slots are filled by new questions.
// Deduplication rule:
// No duplicate questions in a single worksheet. The result is always 8 distinct questions.
//
// Pure functions: no network, no database, deterministic given inputs.

import { isReviewDue, type MasteryState } from "./mastery";

export const WORKSHEET_SIZE = 8;
export const DEFAULT_TARGET_BARU = 4;
export const DEFAULT_TARGET_ADAPTIF = 2;
export const DEFAULT_TARGET_REVIEW = 2;

export type WorksheetCategory = "baru" | "adaptif" | "review";

export interface WorksheetSlot<T = string> {
  index: number;
  slotNumber: number;
  item: T;
  itemId: string;
  category: WorksheetCategory;
  competencyId?: string;
}

export interface ComposedWorksheet<T = string> extends Array<T> {
  items: T[];
  slots: WorksheetSlot<T>[];
  counts: {
    baru: number;
    adaptif: number;
    review: number;
  };
}

export interface CompetencyCandidatePool<T = string> {
  competencyId: string;
  /** Mastery score or tier score from 0 to 1. Lower score indicates weaker performance. */
  score?: number;
  /** Optional mastery state to determine if spaced review is due at timestamp `now`. */
  mastery?: MasteryState;
  items: readonly T[];
}

export interface ComposeWorksheetOptions<T = string> {
  /** Candidate items from active competency (target: 4 items + any unfilled fallback slots). */
  baru: readonly T[] | CompetencyCandidatePool<T>;
  /** Adaptive candidates or competency pools ranked by weakness (target: 2 items). */
  adaptif?: readonly T[] | readonly CompetencyCandidatePool<T>[];
  /** Spaced review candidates due for repetition (target: 2 items). */
  review?: readonly T[] | readonly CompetencyCandidatePool<T>[];
  /** Current time in ms, used when evaluating `mastery.nextReviewAt`. */
  now?: number;
  /** Total questions in the composed worksheet. Default is 8. */
  totalSize?: number;
  /** Target allocations per category. Defaults to { baru: 4, adaptif: 2, review: 2 }. */
  targets?: {
    baru?: number;
    adaptif?: number;
    review?: number;
  };
}

/** Extracts the string ID from a raw string or an item object with `id` or `itemId`. */
export function getItemId<T>(item: T): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    if ("id" in item && typeof (item as { id: unknown }).id === "string") {
      return (item as { id: string }).id;
    }
    if ("itemId" in item && typeof (item as { itemId: unknown }).itemId === "string") {
      return (item as { itemId: string }).itemId;
    }
  }
  return String(item);
}

interface ItemEntry<T> {
  item: T;
  itemId: string;
  competencyId?: string;
}

function isCompetencyPool<T>(value: unknown): value is CompetencyCandidatePool<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "competencyId" in value &&
    "items" in value &&
    Array.isArray((value as CompetencyCandidatePool<T>).items)
  );
}

function normalizeBaruPool<T>(input: readonly T[] | CompetencyCandidatePool<T>): {
  competencyId?: string;
  entries: ItemEntry<T>[];
} {
  if (isCompetencyPool<T>(input)) {
    return {
      competencyId: input.competencyId,
      entries: input.items.map((item) => ({
        item,
        itemId: getItemId(item),
        competencyId: input.competencyId,
      })),
    };
  }

  return {
    entries: input.map((item) => ({
      item,
      itemId: getItemId(item),
    })),
  };
}

function normalizeAdaptifPool<T>(
  input?: readonly T[] | readonly CompetencyCandidatePool<T>[],
): ItemEntry<T>[] {
  if (!input || input.length === 0) return [];

  // Check if input is a list of competency candidate pools
  if (isCompetencyPool<T>(input[0])) {
    const pools = [...(input as readonly CompetencyCandidatePool<T>[])];
    // Sort pools by score ascending (lowest score / weakest competency first)
    pools.sort((a, b) => {
      const scoreA = Number.isFinite(a.score) ? (a.score as number) : 0;
      const scoreB = Number.isFinite(b.score) ? (b.score as number) : 0;
      return scoreA - scoreB;
    });

    const entries: ItemEntry<T>[] = [];
    for (const pool of pools) {
      for (const item of pool.items) {
        entries.push({
          item,
          itemId: getItemId(item),
          competencyId: pool.competencyId,
        });
      }
    }
    return entries;
  }

  // Flat array of items
  return (input as readonly T[]).map((item) => ({
    item,
    itemId: getItemId(item),
  }));
}

function normalizeReviewPool<T>(
  input?: readonly T[] | readonly CompetencyCandidatePool<T>[],
  now?: number,
): ItemEntry<T>[] {
  if (!input || input.length === 0) return [];

  if (isCompetencyPool<T>(input[0])) {
    const pools = input as readonly CompetencyCandidatePool<T>[];
    const entries: ItemEntry<T>[] = [];

    for (const pool of pools) {
      // If mastery is provided and now is given, only include if review is due
      if (pool.mastery && typeof now === "number") {
        if (!isReviewDue(pool.mastery, now)) continue;
      }

      for (const item of pool.items) {
        entries.push({
          item,
          itemId: getItemId(item),
          competencyId: pool.competencyId,
        });
      }
    }
    return entries;
  }

  return (input as readonly T[]).map((item) => ({
    item,
    itemId: getItemId(item),
  }));
}

/**
 * Composes a weekly worksheet of 8 unique questions following the 4/2/2 distribution rule:
 * - 4 new questions from the active competency
 * - 2 adaptive questions from the student's weakest competency
 * - 2 spaced review questions that are due
 *
 * If any category is empty or short, its unfilled slots are allocated to new questions.
 * Resulting worksheet always contains unique items with zero duplicates.
 */
export function composeWorksheet<T = string>(
  options: ComposeWorksheetOptions<T>,
): ComposedWorksheet<T>;

export function composeWorksheet<T = string>(
  baru: readonly T[] | CompetencyCandidatePool<T>,
  adaptif?: readonly T[] | readonly CompetencyCandidatePool<T>[],
  review?: readonly T[] | readonly CompetencyCandidatePool<T>[],
): ComposedWorksheet<T>;

export function composeWorksheet<T = string>(
  inputOrBaru: ComposeWorksheetOptions<T> | readonly T[] | CompetencyCandidatePool<T>,
  maybeAdaptif?: readonly T[] | readonly CompetencyCandidatePool<T>[],
  maybeReview?: readonly T[] | readonly CompetencyCandidatePool<T>[],
): ComposedWorksheet<T> {
  const options: ComposeWorksheetOptions<T> =
    typeof inputOrBaru === "object" && inputOrBaru !== null && "baru" in inputOrBaru
      ? (inputOrBaru as ComposeWorksheetOptions<T>)
      : {
          baru: inputOrBaru as readonly T[] | CompetencyCandidatePool<T>,
          adaptif: maybeAdaptif,
          review: maybeReview,
        };

  const totalSize = options.totalSize ?? WORKSHEET_SIZE;
  const targetReviewBase = options.targets?.review ?? DEFAULT_TARGET_REVIEW;
  const targetAdaptifBase = options.targets?.adaptif ?? DEFAULT_TARGET_ADAPTIF;
  const targetBaruBase = options.targets?.baru ?? DEFAULT_TARGET_BARU;

  const reviewCandidates = normalizeReviewPool(options.review, options.now);
  const adaptifCandidates = normalizeAdaptifPool(options.adaptif);
  const { entries: baruCandidates } = normalizeBaruPool(options.baru);

  const selectedIds = new Set<string>();

  // Helper to pick unique items from a candidate pool
  const pickFromPool = (
    candidates: readonly ItemEntry<T>[],
    limit: number,
  ): ItemEntry<T>[] => {
    const picked: ItemEntry<T>[] = [];
    for (const entry of candidates) {
      if (picked.length >= limit) break;
      if (!selectedIds.has(entry.itemId)) {
        selectedIds.add(entry.itemId);
        picked.push(entry);
      }
    }
    return picked;
  };

  // 1. Pick Spaced Review (target: 2)
  const pickedReview = pickFromPool(reviewCandidates, targetReviewBase);
  const reviewShortfall = Math.max(0, targetReviewBase - pickedReview.length);

  // 2. Pick Adaptive (target: 2)
  const pickedAdaptif = pickFromPool(adaptifCandidates, targetAdaptifBase);
  const adaptifShortfall = Math.max(0, targetAdaptifBase - pickedAdaptif.length);

  // 3. Pick New Questions (target: 4 + shortfalls from review & adaptif)
  const targetBaruTotal = targetBaruBase + reviewShortfall + adaptifShortfall;
  const pickedBaru = pickFromPool(baruCandidates, targetBaruTotal);

  // 4. If baru candidates were insufficient to fill the whole worksheet, attempt
  // filling from any leftover candidates across adaptif and review pools.
  if (selectedIds.size < totalSize) {
    const remainingCandidates = [...baruCandidates, ...adaptifCandidates, ...reviewCandidates];
    for (const entry of remainingCandidates) {
      if (selectedIds.size >= totalSize) break;
      if (!selectedIds.has(entry.itemId)) {
        selectedIds.add(entry.itemId);
        pickedBaru.push(entry);
      }
    }
  }

  // If there are still not enough unique items in total, throw an error
  if (selectedIds.size < totalSize) {
    throw new Error(
      `Tidak cukup butir unik untuk menyusun worksheet: membutuhkan ${totalSize} butir, tetapi hanya tersedia ${selectedIds.size} butir unik.`,
    );
  }

  // Assemble slots in consistent order: baru -> adaptif -> review
  const slots: WorksheetSlot<T>[] = [];
  let currentIndex = 0;

  for (const entry of pickedBaru) {
    slots.push({
      index: currentIndex,
      slotNumber: currentIndex + 1,
      item: entry.item,
      itemId: entry.itemId,
      category: "baru",
      competencyId: entry.competencyId,
    });
    currentIndex += 1;
  }

  for (const entry of pickedAdaptif) {
    slots.push({
      index: currentIndex,
      slotNumber: currentIndex + 1,
      item: entry.item,
      itemId: entry.itemId,
      category: "adaptif",
      competencyId: entry.competencyId,
    });
    currentIndex += 1;
  }

  for (const entry of pickedReview) {
    slots.push({
      index: currentIndex,
      slotNumber: currentIndex + 1,
      item: entry.item,
      itemId: entry.itemId,
      category: "review",
      competencyId: entry.competencyId,
    });
    currentIndex += 1;
  }

  const items = slots.map((s) => s.item);

  const counts = {
    baru: pickedBaru.length,
    adaptif: pickedAdaptif.length,
    review: pickedReview.length,
  };

  const result = Object.assign([...items], {
    items,
    slots,
    counts,
  }) as ComposedWorksheet<T>;

  return result;
}
