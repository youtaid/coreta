import "server-only";

import { currentUser } from "@/lib/auth/session-server";
import { UUID_PATTERN } from "@/lib/ids";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  type AssignmentRow,
  buildPathStages,
  pickNextWorksheet,
  toWorkspaceQuestions,
  toWorksheetSummary,
} from "./mappers";

// Semua kueri di sini memakai sesi siswa (bukan service role), jadi RLS menentukan apa yang
// terbaca: siswa hanya melihat penugasan, penguasaan, dan aktivitasnya sendiri, dan butir hanya
// lewat view items_public (tanpa kunci jawaban, aturan 1).

const jakartaDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" });

/** Tanggal kalender hari ini di Asia/Jakarta, YYYY-MM-DD (sama dengan daily_activity.date). */
export function jakartaToday(now = new Date()) {
  return jakartaDate.format(now);
}

export async function getCurrentStudent() {
  const user = await currentUser();
  if (user?.role !== "siswa") return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, goal, daily_target")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function check<R extends { data: unknown; error: { message: string } | null }>(
  result: R,
  what: string,
): Exclude<R["data"], undefined> {
  if (result.error) throw new Error(`${what} gagal dimuat: ${result.error.message}`);
  return result.data as Exclude<R["data"], undefined>;
}

/** Hasil daftar: setelah galat diperiksa, data null berarti kosong. */
function rows<R extends { data: unknown; error: { message: string } | null }>(
  result: R,
  what: string,
): NonNullable<R["data"]> {
  return (check(result, what) ?? []) as NonNullable<R["data"]>;
}

export async function getWorksheetSummaries(now = new Date()) {
  const supabase = await createClient();
  const assignments = rows(
    await supabase
      .from("assignments")
      .select(
        "id, completed_at, assigned_at, worksheets(title, release_at, stages(number, name), worksheet_items(slot, item_id)), attempts(item_id, try_no, score)",
      )
      .order("assigned_at", { ascending: false }),
    "Penugasan",
  );
  return (assignments as unknown as AssignmentRow[])
    .map((row) => toWorksheetSummary(row, now))
    .filter((summary) => summary !== null);
}

export async function getLearningPath(student: { id: string; goal: string; daily_target: number }) {
  const supabase = await createClient();
  const today = jakartaToday();
  const [stages, competencies, mastery, activity, worksheets] = await Promise.all([
    supabase.from("stages").select("id, number, name, goal_scope"),
    supabase.from("competencies").select("id, stage_id"),
    supabase.from("mastery").select("competency_id, mastered_at").eq("student_id", student.id),
    supabase
      .from("daily_activity")
      .select("date, items_done")
      .eq("student_id", student.id)
      .order("date", { ascending: false })
      .limit(60),
    getWorksheetSummaries(),
  ]);

  const pathStages = buildPathStages(
    rows(stages, "Tahap"),
    rows(competencies, "Kompetensi"),
    rows(mastery, "Penguasaan"),
    student.goal,
  );
  const days = rows(activity, "Aktivitas").map((day) => ({
    date: day.date,
    count: day.items_done,
  }));

  return {
    stages: pathStages,
    nextWorksheet: pickNextWorksheet(worksheets),
    today,
    todayCount: days.find((day) => day.date === today)?.count ?? 0,
    dailyGoal: student.daily_target,
    activity: days,
  };
}

/** Penugasan siswa beserta soalnya (lewat items_public), atau null bila bukan miliknya. */
export async function getWorkspaceAssignment(assignmentId: string) {
  if (!UUID_PATTERN.test(assignmentId)) return null;
  const supabase = await createClient();

  const assignment = check(
    await supabase
      .from("assignments")
      .select("id, worksheets(title, stages(number, name), worksheet_items(item_id, position))")
      .eq("id", assignmentId)
      .maybeSingle(),
    "Penugasan",
  );
  const worksheet = assignment?.worksheets;
  if (!assignment || !worksheet) return null;

  const order = [...worksheet.worksheet_items].sort((a, b) => a.position - b.position);
  const ids = order.map((entry) => entry.item_id);
  const items = rows(
    await supabase
      .from("items_public")
      .select("id, code, competency_id, tier, answer_type, stem, options, layout_mode, stimulus_id")
      .in("id", ids),
    "Soal",
  );
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered = ids.flatMap((id) => {
    const item = byId.get(id);
    return item && item.id && item.code ? [item] : [];
  });

  const mediaIds = ordered.flatMap((item) => {
    const stem = item.stem as { media_ids?: unknown } | null;
    return Array.isArray(stem?.media_ids)
      ? stem.media_ids.filter((id) => typeof id === "string")
      : [];
  });
  const stimulusIds = ordered.flatMap((item) => (item.stimulus_id ? [item.stimulus_id] : []));
  const competencyIds = [...new Set(ordered.map((item) => item.competency_id))];

  const [competencies, media, stimuli] = await Promise.all([
    supabase
      .from("competencies")
      .select("id, name")
      .in("id", competencyIds as string[]),
    mediaIds.length
      ? supabase
          .from("media_assets_public")
          .select("id, kind, alt_text, transcript, pasteable")
          .in("id", mediaIds)
      : Promise.resolve({ data: [], error: null }),
    stimulusIds.length
      ? supabase.from("stimuli_public").select("id, kind, body").in("id", stimulusIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const questions = toWorkspaceQuestions(
    ordered.map((item) => ({
      id: item.id!,
      code: item.code!,
      competency_id: item.competency_id ?? "",
      tier: item.tier ?? "dasar",
      answer_type: item.answer_type ?? "pg",
      stem: item.stem,
      options: item.options,
      layout_mode: item.layout_mode ?? "standar",
      stimulus_id: item.stimulus_id,
    })),
    {
      competencyNames: new Map(rows(competencies, "Kompetensi").map((row) => [row.id, row.name])),
      media: new Map(
        rows(media, "Media").flatMap((row) =>
          row.id && row.kind && row.alt_text
            ? [
                [
                  row.id,
                  {
                    id: row.id,
                    kind: row.kind,
                    alt_text: row.alt_text,
                    transcript: row.transcript,
                    pasteable: row.pasteable ?? false,
                  },
                ] as const,
              ]
            : [],
        ),
      ),
      stimuli: new Map(
        rows(stimuli, "Stimulus").flatMap((row) =>
          row.id && row.kind
            ? [[row.id, { id: row.id, kind: row.kind, body: row.body }] as const]
            : [],
        ),
      ),
    },
  );

  return {
    id: assignment.id,
    title: worksheet.title,
    stageName: worksheet.stages
      ? `Tahap ${worksheet.stages.number} · ${worksheet.stages.name}`
      : "",
    questions,
    itemIds: ordered.map((item) => item.id!),
  };
}

/**
 * Kunci jawaban untuk menilai penugasan ini. Butir diambil dari worksheet penugasan (dibaca dengan
 * sesi siswa, jadi hanya penugasannya sendiri), lalu kuncinya dibaca dengan service role. Hasilnya
 * tidak pernah dikirim ke browser.
 */
export async function getAnswerKeysForAssignment(assignmentId: string) {
  if (!UUID_PATTERN.test(assignmentId)) return null;
  const supabase = await createClient();
  const assignment = check(
    await supabase
      .from("assignments")
      .select("id, worksheets(worksheet_items(item_id, position))")
      .eq("id", assignmentId)
      .maybeSingle(),
    "Penugasan",
  );
  const entries = assignment?.worksheets?.worksheet_items;
  if (!entries) return null;
  const ids = [...entries].sort((a, b) => a.position - b.position).map((entry) => entry.item_id);

  const keys = rows(
    await createAdminClient()
      .from("items")
      .select("id, answer_type, options, answer_key, equivalents, tolerance, distractor_hints")
      .in("id", ids)
      .eq("status", "published"),
    "Kunci jawaban",
  );
  const byId = new Map(keys.map((row) => [row.id, row]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [row] : [];
  });
}
