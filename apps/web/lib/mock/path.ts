import type { WorksheetSummary } from "@/lib/domain";

import { stages, worksheets } from "./learning";
import { DAILY_GOAL, dailyActivity } from "./progress";

// Mock "today" is the last day with activity data in progress.ts, so the path screen, the
// progress calendar, and weeklyStats all describe the same moment.
export const TODAY = "2026-10-07";

export const pathStages = stages;

export const dailyGoal = DAILY_GOAL;

export const todayCount = dailyActivity.find((day) => day.date === TODAY)?.count ?? 0;

export const pathActivity = dailyActivity;

/** Worksheet the "Lanjut belajar" card points at: an unfinished one, else the next new one. */
export const nextWorksheet: WorksheetSummary | undefined =
  worksheets.find((worksheet) => worksheet.status === "in_progress") ??
  worksheets.find((worksheet) => worksheet.status === "review" || worksheet.status === "new");
