import type {
  AdminItem,
  AdminWorksheet,
  ItemHealthFlag,
  ItemStats,
  ItemStatus,
  WorkspaceLayoutMode,
} from "@/lib/domain";
import { resolveLayout } from "@/lib/workspace-fit";

// --- Item health -------------------------------------------------------------------------------

/** Statistics are only trusted once enough students have answered. */
export const MIN_ATTEMPTS_FOR_HEALTH = 30;
export const TOO_EASY_ABOVE = 0.92;
export const TOO_HARD_BELOW = 0.25;
export const OFTEN_REPORTED_AT = 3;

export const itemHealthLabels: Record<ItemHealthFlag, string> = {
  too_easy: "Terlalu mudah",
  too_hard: "Terlalu sulit",
  often_reported: "Sering dilaporkan",
};

export function itemHealth(stats: ItemStats): ItemHealthFlag[] {
  const flags: ItemHealthFlag[] = [];
  if (stats.attempts >= MIN_ATTEMPTS_FOR_HEALTH) {
    if (stats.correctRate > TOO_EASY_ABOVE) flags.push("too_easy");
    if (stats.correctRate < TOO_HARD_BELOW) flags.push("too_hard");
  }
  if (stats.reportCount >= OFTEN_REPORTED_AT) flags.push("often_reported");
  return flags;
}

// --- Item validation ---------------------------------------------------------------------------

export type ValidationRule =
  "stem" | "options" | "answer_key" | "hints" | "explanation" | "alt_text" | "layout_mode";

export interface ValidationIssue {
  rule: ValidationRule;
  message: string;
}

const LAYOUT_MODES: readonly WorkspaceLayoutMode[] = ["standar", "media", "bacaan"];

const isChoice = (item: Pick<AdminItem, "answerType">) =>
  item.answerType === "pg" || item.answerType === "pgk";

/**
 * Checks an item can be published: it has a key, a hint for every wrong option, an explanation,
 * alt text for media, and a layout mode that matches its content (TIP, content validator).
 */
export function validateItem(
  item: Pick<
    AdminItem,
    | "answerType"
    | "stem"
    | "options"
    | "answerKey"
    | "explanation"
    | "layoutMode"
    | "media"
    | "stimulus"
  >,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (rule: ValidationRule, message: string) => issues.push({ rule, message });

  if (item.stem.trim() === "") add("stem", "Teks soal masih kosong.");

  if (item.answerType !== "isian" && item.options.length < 2) {
    add("options", "Butir pilihan butuh minimal dua opsi.");
  }

  const key = item.answerKey.filter((entry) => entry.trim() !== "");
  if (key.length === 0) {
    add("answer_key", "Kunci jawaban belum diisi.");
  } else if (item.answerType === "pg" && key.length > 1) {
    add("answer_key", "Pilihan ganda hanya boleh punya satu kunci.");
  } else if (isChoice(item)) {
    const unknown = key.filter((id) => !item.options.some((option) => option.id === id));
    if (unknown.length > 0) add("answer_key", "Kunci menunjuk opsi yang tidak ada.");
  }

  if (isChoice(item)) {
    const missing = item.options.filter(
      (option) => !key.includes(option.id) && (option.hint ?? "").trim() === "",
    );
    if (missing.length > 0) {
      const labels = missing.map((option) => option.label).join(", ");
      add("hints", `Pengecoh ${labels} belum punya petunjuk.`);
    }
  }

  if (item.explanation.trim() === "") add("explanation", "Pembahasan belum ditulis.");

  if (item.media && item.media.altText.trim() === "") {
    add("alt_text", "Media wajib punya teks alternatif.");
  }

  if (!LAYOUT_MODES.includes(item.layoutMode)) {
    add("layout_mode", "layout_mode tidak valid.");
  } else {
    const { mode } = resolveLayout(item);
    if (mode !== item.layoutMode) {
      add("layout_mode", `layout_mode "${item.layoutMode}" tidak muat; isi butir butuh "${mode}".`);
    }
  }

  return issues;
}

// --- Worksheets --------------------------------------------------------------------------------

export const WORKSHEET_SLOTS = { new: 4, adaptive: 2, review: 2 } as const;

export function worksheetItemCount(worksheet: Pick<AdminWorksheet, "slots">): number {
  return worksheet.slots.new + worksheet.slots.adaptive + worksheet.slots.review;
}

/** Why a worksheet cannot be released yet; an empty list means it can. */
export function worksheetBlockers(worksheet: AdminWorksheet): string[] {
  const blockers: string[] = [];
  for (const slot of ["new", "adaptive", "review"] as const) {
    if (worksheet.slots[slot] !== WORKSHEET_SLOTS[slot]) {
      blockers.push(
        `Slot ${slotNames[slot]} berisi ${worksheet.slots[slot]} soal, seharusnya ${WORKSHEET_SLOTS[slot]}.`,
      );
    }
  }
  if (worksheet.unpublishedItems > 0) {
    blockers.push(`${worksheet.unpublishedItems} butir belum terbit.`);
  }
  return blockers;
}

export const slotNames = { new: "baru", adaptive: "adaptif", review: "ulang" } as const;

// --- Item list filters -------------------------------------------------------------------------

export const itemStatusLabels: Record<ItemStatus, string> = {
  draft: "Draf",
  review: "Ditinjau",
  published: "Terbit",
  retired: "Dipensiunkan",
};

export interface ItemFilter {
  query: string;
  status: ItemStatus | "all";
  tier: AdminItem["tier"] | "all";
  unhealthyOnly: boolean;
}

export function filterItems(items: readonly AdminItem[], filter: ItemFilter): AdminItem[] {
  const query = filter.query.trim().toLowerCase();
  return items.filter((item) => {
    if (filter.status !== "all" && item.status !== filter.status) return false;
    if (filter.tier !== "all" && item.tier !== filter.tier) return false;
    if (filter.unhealthyOnly && itemHealth(item.stats).length === 0) return false;
    if (query === "") return true;
    return [item.code, item.competencyName, item.competencyCode].some((field) =>
      field.toLowerCase().includes(query),
    );
  });
}
