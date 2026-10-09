import type { WorkspaceLayoutMode, WorkspaceQuestion } from "@/lib/domain";

// Layout modes ordered from least to most space-hungry. The mode a question declares is a
// floor: content that does not fit pushes the workspace up this ladder, never down.
const MODE_ORDER: readonly WorkspaceLayoutMode[] = ["standar", "media", "bacaan"];

export type FitReason = "declared" | "has_media" | "has_stimulus";

export type MediaPlacement = "none" | "inline" | "floating";

export interface ResolvedLayout {
  mode: WorkspaceLayoutMode;
  /** Why the mode was chosen; anything other than "declared" means it was escalated. */
  reason: FitReason;
  /**
   * Where media is shown. Reading mode already splits the screen into reading, question, and
   * scratch areas, so media that comes with a reading passage floats above them instead.
   */
  mediaPlacement: MediaPlacement;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

function modeRank(mode: WorkspaceLayoutMode): number {
  return MODE_ORDER.indexOf(mode);
}

/** Applies the "tidak muat" rule: standar → media → bacaan. */
export function resolveLayout(
  question: Pick<WorkspaceQuestion, "layoutMode" | "media" | "stimulus">,
): ResolvedLayout {
  let mode = question.layoutMode;
  let reason: FitReason = "declared";

  const escalate = (to: WorkspaceLayoutMode, because: FitReason) => {
    if (modeRank(to) > modeRank(mode)) {
      mode = to;
      reason = because;
    }
  };

  if (question.media) escalate("media", "has_media");
  if (question.stimulus) escalate("bacaan", "has_stimulus");

  let mediaPlacement: MediaPlacement = "none";
  if (question.media) mediaPlacement = mode === "bacaan" ? "floating" : "inline";

  return { mode, reason, mediaPlacement };
}
