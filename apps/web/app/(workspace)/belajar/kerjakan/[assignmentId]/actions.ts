"use server";

import { z } from "zod";

import { currentUser } from "@/lib/auth/session-server";
import type { GradedWorksheetResult } from "@/lib/domain";
import { answersSchema, gradeItems } from "@/lib/grading";
import { uuidLike } from "@/lib/ids";
import { getAnswerKeysForAssignment } from "@/lib/queries/student";

const inputSchema = z.object({
  assignmentId: uuidLike(),
  answers: answersSchema,
  elapsedSeconds: z
    .number()
    .int()
    .min(0)
    .max(24 * 60 * 60),
});

/**
 * Menilai worksheet di server dengan @coreta/scoring; kunci jawaban tidak pernah dikirim ke
 * browser (aturan 1 dan 2). Yang kembali hanya skor dan petunjuk pengecoh per butir.
 *
 * Belum menyimpan percobaan: penyimpanan (attempts, id dari klien, idempoten) adalah Fase 38.
 */
export async function gradeWorksheet(input: {
  assignmentId: string;
  answers: unknown;
  elapsedSeconds: number;
}): Promise<GradedWorksheetResult> {
  const user = await currentUser();
  if (user?.role !== "siswa") throw new Error("Hanya siswa yang dapat mengirim jawaban.");

  const parsed = inputSchema.parse(input);
  const keys = await getAnswerKeysForAssignment(parsed.assignmentId);
  if (!keys) throw new Error("Penugasan tidak ditemukan.");

  const graded = gradeItems(keys, parsed.answers);
  return {
    assignmentId: parsed.assignmentId,
    overallScore: graded.overallScore,
    results: graded.results,
    completedAt: Date.now(),
    durationSeconds: parsed.elapsedSeconds,
  };
}
