import type { AdminItem, WorkspaceQuestion } from "@/lib/domain";

export interface PreviewSize {
  id: "landscape" | "portrait" | "phone";
  label: string;
  width: number;
  height: number;
}

/** The three screens the workspace must fit without scrolling (TIP, phase 10). */
export const previewSizes: readonly PreviewSize[] = [
  { id: "landscape", label: "Tablet mendatar", width: 1180, height: 820 },
  { id: "portrait", label: "Tablet tegak", width: 820, height: 1180 },
  { id: "phone", label: "Ponsel", width: 390, height: 844 },
];

/** Shrinks a frame to fit its container, never enlarging it past real size. */
export function previewScale(containerWidth: number, frameWidth: number): number {
  if (containerWidth <= 0) return 1;
  return Math.min(1, containerWidth / frameWidth);
}

/** What the workspace needs to render one item on its own. */
export function itemToWorkspaceQuestion(item: AdminItem): WorkspaceQuestion {
  return {
    id: item.id,
    number: 1,
    totalQuestions: 1,
    code: item.code,
    competencyName: item.competencyName,
    tier: item.tier,
    answerType: item.answerType,
    layoutMode: item.layoutMode,
    prompt: item.stem,
    formula: item.formula,
    options: item.options.map(({ id, label, text }) => ({ id, label, text })),
    media: item.media,
    stimulus: item.stimulus,
  };
}
