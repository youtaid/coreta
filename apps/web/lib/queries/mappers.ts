// Pemetaan baris Supabase ke tipe tampilan (TIP Fase 37). Fungsi murni tanpa akses data, jadi bisa
// dites tanpa basis data. Pengambilan datanya ada di lib/queries/student.ts.

import { z } from "zod";

import type {
  AnswerType,
  QuestionTier,
  Stage,
  WorkspaceLayoutMode,
  WorkspaceMedia,
  WorkspaceQuestion,
  WorkspaceStimulus,
  WorksheetStatus,
  WorksheetSummary,
} from "@/lib/domain";

// --- Jalur belajar ------------------------------------------------------------------------------

export interface StageRow {
  id: string;
  number: number;
  name: string;
  goal_scope: string;
}

export interface CompetencyRow {
  id: string;
  stage_id: string;
}

export interface MasteryRow {
  competency_id: string;
  mastered_at: string | null;
}

/** Tahap yang relevan untuk target ujian siswa: Tahap khusus UTBK tidak tampil untuk siswa TKA. */
export function stageMatchesGoal(goalScope: string, goal: string) {
  return goalScope === "all" || goal === "both" || goalScope === goal;
}

/**
 * Peta tahap dari kurikulum dan penguasaan siswa. Tahap tuntas bila semua kompetensinya tuntas;
 * tahap pertama yang belum tuntas aktif; sisanya terkunci (TIP: tahap berikutnya terbuka setelah
 * semua kompetensi tahap aktif tuntas).
 */
export function buildPathStages(
  stages: readonly StageRow[],
  competencies: readonly CompetencyRow[],
  mastery: readonly MasteryRow[],
  goal: string,
): Stage[] {
  const mastered = new Set(
    mastery.filter((row) => row.mastered_at !== null).map((row) => row.competency_id),
  );
  let activeFound = false;

  return [...stages]
    .filter((stage) => stageMatchesGoal(stage.goal_scope, goal))
    .sort((a, b) => a.number - b.number)
    .map((stage) => {
      const own = competencies.filter((competency) => competency.stage_id === stage.id);
      const done = own.filter((competency) => mastered.has(competency.id)).length;
      const progress = own.length === 0 ? 0 : done / own.length;
      const complete = own.length > 0 && done === own.length;

      let status: Stage["status"];
      if (activeFound) status = "locked";
      else if (complete) status = "mastered";
      else {
        status = "active";
        activeFound = true;
      }
      return { number: stage.number, name: stage.name, status, progress };
    });
}

// --- Daftar worksheet ---------------------------------------------------------------------------

export interface AssignmentRow {
  id: string;
  completed_at: string | null;
  worksheets: {
    title: string;
    release_at: string;
    stages: { number: number; name: string } | null;
    worksheet_items: { slot: string; item_id: string }[];
  } | null;
  attempts: { item_id: string; try_no: number; score: number }[];
}

/** Perkiraan waktu kerja per soal, untuk label kartu worksheet. */
export const MINUTES_PER_ITEM = 3;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function toWorksheetSummary(row: AssignmentRow, now: Date): WorksheetSummary | null {
  const worksheet = row.worksheets;
  if (!worksheet) return null;

  const items = worksheet.worksheet_items;
  const answered = new Set(row.attempts.map((attempt) => attempt.item_id));
  const allReview = items.length > 0 && items.every((item) => item.slot === "ulang");

  let status: WorksheetStatus;
  if (row.completed_at) status = "completed";
  else if (answered.size > 0) status = "in_progress";
  else if (allReview) status = "review";
  else status = "new";

  // Skor akhir = rata-rata percobaan pertama tiap butir (sama dengan model penguasaan).
  const firstTries = row.attempts.filter((attempt) => attempt.try_no === 1);
  const score =
    status === "completed" && items.length > 0
      ? firstTries.reduce((sum, attempt) => sum + Number(attempt.score), 0) / items.length
      : undefined;

  const released = new Date(worksheet.release_at).getTime();
  const dueLabel =
    status === "review"
      ? "Hari ini"
      : status !== "completed" && now.getTime() - released < WEEK_MS
        ? "Minggu ini"
        : undefined;

  const stageNumber = worksheet.stages?.number ?? 0;
  return {
    id: row.id,
    title: worksheet.title,
    stageNumber,
    stageName: worksheet.stages
      ? `Tahap ${worksheet.stages.number} · ${worksheet.stages.name}`
      : "Tahap",
    itemCount: items.length,
    answeredCount: Math.min(answered.size, items.length),
    estimatedMinutes: items.length * MINUTES_PER_ITEM,
    status,
    ...(score !== undefined && { score }),
    ...(dueLabel && { dueLabel }),
  };
}

/** Worksheet berikutnya untuk tombol "Lanjut belajar": yang sedang dikerjakan, lalu yang baru. */
export function pickNextWorksheet(worksheets: readonly WorksheetSummary[]) {
  return (
    worksheets.find((worksheet) => worksheet.status === "in_progress") ??
    worksheets.find((worksheet) => worksheet.status === "new" || worksheet.status === "review")
  );
}

// --- Ruang kerja --------------------------------------------------------------------------------

const optionSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  text: z.string().optional(),
});
const stemSchema = z.object({
  text: z.string().optional(),
  formula: z.string().optional(),
  media_ids: z.array(z.string()).optional(),
});
const stimulusBodySchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  text: z.string().optional(),
});

/** Baris dari view items_public: tanpa kunci jawaban, petunjuk pengecoh, atau pembahasan. */
export interface PublicItemRow {
  id: string;
  code: string;
  competency_id: string;
  tier: string;
  answer_type: string;
  stem: unknown;
  options: unknown;
  layout_mode: string;
  stimulus_id: string | null;
}

export interface PublicMediaRow {
  id: string;
  kind: string;
  alt_text: string;
  transcript: string | null;
  pasteable: boolean;
}

export interface PublicStimulusRow {
  id: string;
  kind: string;
  body: unknown;
}

const answerTypes: readonly AnswerType[] = ["pg", "pgk", "bs", "isian"];
const tiers: readonly QuestionTier[] = ["dasar", "mahir", "ujian"];
const layouts: readonly WorkspaceLayoutMode[] = ["standar", "media", "bacaan"];
const mediaKinds: readonly WorkspaceMedia["kind"][] = [
  "diagram",
  "image",
  "table",
  "audio",
  "video",
];
const stimulusKinds: readonly WorkspaceStimulus["kind"][] = ["reading", "table", "media_set"];

function oneOf<T extends string>(values: readonly T[], value: string, fallback: T): T {
  return (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function toWorkspaceQuestions(
  items: readonly PublicItemRow[],
  lookups: {
    competencyNames: ReadonlyMap<string, string>;
    media: ReadonlyMap<string, PublicMediaRow>;
    stimuli: ReadonlyMap<string, PublicStimulusRow>;
  },
): WorkspaceQuestion[] {
  return items.map((item, index) => {
    const stem = stemSchema.safeParse(item.stem).data ?? {};
    const options = (z.array(optionSchema).safeParse(item.options).data ?? []).map((option) => ({
      id: option.id,
      label: option.label ?? option.id.toUpperCase(),
      text: option.text ?? "",
    }));
    const answerType = oneOf(answerTypes, item.answer_type, "pg");

    const mediaRow = stem.media_ids?.map((id) => lookups.media.get(id)).find(Boolean);
    const media: WorkspaceMedia | undefined = mediaRow && {
      id: mediaRow.id,
      kind: oneOf(mediaKinds, mediaRow.kind, "image"),
      altText: mediaRow.alt_text,
      pasteable: mediaRow.pasteable,
      ...(mediaRow.transcript && { transcript: mediaRow.transcript }),
    };

    const stimulusRow = item.stimulus_id ? lookups.stimuli.get(item.stimulus_id) : undefined;
    const body = stimulusRow ? (stimulusBodySchema.safeParse(stimulusRow.body).data ?? {}) : null;
    const stimulus: WorkspaceStimulus | undefined =
      stimulusRow && body
        ? {
            id: stimulusRow.id,
            kind: oneOf(stimulusKinds, stimulusRow.kind, "reading"),
            title: body.title ?? "Bacaan",
            bodyText: body.text ?? "",
            ...(body.subtitle && { subtitle: body.subtitle }),
            ...(body.source && { source: body.source }),
          }
        : undefined;

    return {
      id: item.id,
      number: index + 1,
      totalQuestions: items.length,
      code: item.code,
      competencyName: lookups.competencyNames.get(item.competency_id) ?? "",
      tier: oneOf(tiers, item.tier, "dasar"),
      answerType,
      layoutMode: oneOf(layouts, item.layout_mode, "standar"),
      prompt: stem.text ?? "",
      ...(stem.formula && { formula: stem.formula }),
      ...(answerType === "bs"
        ? { statements: options }
        : answerType === "isian"
          ? { placeholder: "Tulis jawaban dalam angka" }
          : { options }),
      ...(media && { media }),
      ...(stimulus && { stimulus }),
    };
  });
}
