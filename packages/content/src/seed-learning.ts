// Data belajar contoh untuk supabase/seed.sql (TIP Fase 37): worksheet terbit dan butirnya,
// penugasan, penguasaan kompetensi, dan aktivitas harian siswa seed.

import { z } from "zod";

const WorksheetSchema = z.strictObject({
  key: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  stage: z.number().int().min(0).max(8),
  released_days_ago: z.number().int().min(0).max(60),
  items: z
    .array(z.strictObject({ code: z.string().min(1), slot: z.enum(["baru", "adaptif", "ulang"]) }))
    .min(1),
});

const StudentLearningSchema = z.strictObject({
  student_id: z.uuid(),
  assignments: z.array(z.string()),
  mastered_stages: z.array(z.number().int().min(0).max(8)),
  mastered_competencies: z.array(z.string()),
  learning: z.array(
    z.strictObject({
      competency: z.string(),
      tier: z.enum(["dasar", "mahir", "ujian"]),
      score: z.number().min(0).max(1),
      n_attempts: z.number().int().min(0),
    }),
  ),
  /** Soal dikerjakan per hari, dari yang paling lama sampai hari ini. */
  activity: z.array(z.number().int().min(0).max(200)).max(60),
});

export const LearningSchema = z.object({
  worksheets: z.array(WorksheetSchema),
  students: z.array(StudentLearningSchema),
});

export type Learning = z.infer<typeof LearningSchema>;

export interface LearningContext {
  competencies: readonly { code: string; stage: number }[];
  stageNumbers: ReadonlySet<number>;
  publishedItemCodes: ReadonlySet<string>;
  /** student id → daily target, from families.json. */
  dailyTargets: ReadonlyMap<string, number>;
}

export function validateLearning(learning: Learning, context: LearningContext): string[] {
  const problems: string[] = [];
  const competencyCodes = new Set(context.competencies.map((competency) => competency.code));
  const worksheetKeys = new Set<string>();

  for (const worksheet of learning.worksheets) {
    if (worksheetKeys.has(worksheet.key))
      problems.push(`learning.json: worksheet ${worksheet.key} kembar.`);
    worksheetKeys.add(worksheet.key);
    if (!context.stageNumbers.has(worksheet.stage)) {
      problems.push(
        `learning.json: worksheet ${worksheet.key} menunjuk tahap ${worksheet.stage} yang tidak ada.`,
      );
    }
    const codes = worksheet.items.map((item) => item.code);
    if (new Set(codes).size !== codes.length) {
      problems.push(`learning.json: worksheet ${worksheet.key} memuat butir yang sama dua kali.`);
    }
    for (const code of codes) {
      if (!context.publishedItemCodes.has(code)) {
        problems.push(
          `learning.json: worksheet ${worksheet.key} memuat ${code} yang tidak ada atau belum terbit.`,
        );
      }
    }
  }

  const studentIds = new Set<string>();
  for (const student of learning.students) {
    const label = `learning.json: siswa ${student.student_id}`;
    if (studentIds.has(student.student_id)) problems.push(`${label} kembar.`);
    studentIds.add(student.student_id);
    if (!context.dailyTargets.has(student.student_id))
      problems.push(`${label} tidak ada di families.json.`);
    for (const key of student.assignments) {
      if (!worksheetKeys.has(key)) problems.push(`${label}: worksheet ${key} tidak ada.`);
    }
    for (const stage of student.mastered_stages) {
      if (!context.stageNumbers.has(stage)) problems.push(`${label}: tahap ${stage} tidak ada.`);
    }
    const touched = [
      ...student.mastered_competencies,
      ...student.learning.map((entry) => entry.competency),
    ];
    for (const code of touched) {
      if (!competencyCodes.has(code)) problems.push(`${label}: kompetensi ${code} tidak ada.`);
    }
    if (new Set(touched).size !== touched.length) {
      problems.push(`${label}: kompetensi yang sama dicatat dua kali.`);
    }
    const masteredByStage = new Set(
      context.competencies
        .filter((competency) => student.mastered_stages.includes(competency.stage))
        .map((competency) => competency.code),
    );
    for (const code of touched) {
      if (masteredByStage.has(code)) {
        problems.push(`${label}: ${code} sudah tuntas lewat mastered_stages.`);
      }
    }
  }
  return problems;
}

export interface LearningSqlHelpers {
  uuid: (kind: string, key: string) => string;
  string: (value: string) => string;
  itemId: (code: string) => string;
  stageId: (stage: number) => string;
  competencyId: (code: string) => string;
}

const today = "(now() at time zone 'Asia/Jakarta')::date";

export function renderLearning(
  learning: Learning,
  context: LearningContext,
  sql: LearningSqlHelpers,
): string[] {
  const out: string[] = [];
  const worksheetId = (key: string) => sql.uuid("worksheet", key);

  out.push("-- Data belajar contoh (Fase 37): worksheet terbit, penugasan, penguasaan, aktivitas");
  out.push("insert into public.worksheets (id, title, stage_id, release_at, status) values");
  out.push(
    learning.worksheets
      .map(
        (worksheet) =>
          `  (${sql.string(worksheetId(worksheet.key))}, ${sql.string(worksheet.title)}, ${sql.string(sql.stageId(worksheet.stage))}, now() - interval '${worksheet.released_days_ago} days', 'published')`,
      )
      .join(",\n") + ";",
  );
  out.push("");
  out.push("insert into public.worksheet_items (worksheet_id, item_id, position, slot) values");
  out.push(
    learning.worksheets
      .flatMap((worksheet) =>
        worksheet.items.map(
          (item, index) =>
            `  (${sql.string(worksheetId(worksheet.key))}, ${sql.string(sql.itemId(item.code))}, ${index + 1}, ${sql.string(item.slot)})`,
        ),
      )
      .join(",\n") + ";",
  );

  const assignments = learning.students.flatMap((student) =>
    student.assignments.map((key) => ({ student, key })),
  );
  if (assignments.length > 0) {
    out.push("");
    out.push("insert into public.assignments (id, student_id, worksheet_id, assigned_at) values");
    out.push(
      assignments
        .map(
          ({ student, key }) =>
            `  (${sql.string(sql.uuid("assignment", `${student.student_id}:${key}`))}, ${sql.string(student.student_id)}, ${sql.string(worksheetId(key))}, now() - interval '1 day')`,
        )
        .join(",\n") + ";",
    );
  }

  const mastery = learning.students.flatMap((student) => {
    const mastered = [
      ...context.competencies
        .filter((competency) => student.mastered_stages.includes(competency.stage))
        .map((competency) => competency.code),
      ...student.mastered_competencies,
    ].map(
      (code) =>
        `  (${sql.string(student.student_id)}, ${sql.string(sql.competencyId(code))}, 'ujian', 0.9, 10, now() - interval '10 days', 1, now() + interval '4 days')`,
    );
    const learningRows = student.learning.map(
      (entry) =>
        `  (${sql.string(student.student_id)}, ${sql.string(sql.competencyId(entry.competency))}, ${sql.string(entry.tier)}, ${entry.score}, ${entry.n_attempts}, null, 0, null)`,
    );
    return [...mastered, ...learningRows];
  });
  if (mastery.length > 0) {
    out.push("");
    out.push(
      "insert into public.mastery (student_id, competency_id, tier, score, n_attempts, mastered_at, review_step, next_review_at) values",
    );
    out.push(mastery.join(",\n") + ";");
  }

  const activity = learning.students.flatMap((student) => {
    const target = context.dailyTargets.get(student.student_id) ?? 1;
    return student.activity.map((count, index) => {
      const daysAgo = student.activity.length - 1 - index;
      return `  (${sql.string(student.student_id)}, ${today} - ${daysAgo}, ${count}, ${count * 3}, ${count >= target})`;
    });
  });
  if (activity.length > 0) {
    out.push("");
    out.push(
      "insert into public.daily_activity (student_id, date, items_done, minutes, target_met) values",
    );
    out.push(activity.join(",\n") + ";");
  }
  return out;
}
