// Builds supabase/seed.sql from the seed files in packages/content/seed (TIP Fase 34).
// Run with `pnpm --filter @coreta/content seed:sql`; `seed:sql --check` fails when the committed
// seed.sql is out of date. Not exported from the package index: it uses node:crypto.

import { createHash } from "node:crypto";

import { z } from "zod";

import { importItems, formatImportReport } from "./import";
import type { Item } from "./schema";

// --- Seed file shapes ---------------------------------------------------------------------------

const StageSchema = z.strictObject({
  number: z.number().int().min(0).max(8),
  name: z.string().min(1),
  goal_scope: z.enum(["all", "tka", "utbk"]),
});

const CompetencySchema = z.strictObject({
  code: z.string().regex(/^M[0-8]\.[0-9]+$/, "Kode kompetensi berbentuk M<tahap>.<nomor>."),
  stage: z.number().int().min(0).max(8),
  domain: z.string().min(1),
  name: z.string().min(1),
  exam_tags: z.array(z.enum(["tka", "utbk"])),
});

export const CurriculumSchema = z.object({
  stages: z.array(StageSchema),
  competencies: z.array(CompetencySchema),
  /** [competency, prerequisite] pairs. */
  prereqs: z.array(z.tuple([z.string(), z.string()])),
});

export const StimuliSchema = z.object({
  stimuli: z.array(
    z.strictObject({
      id: z.string().min(1),
      kind: z.enum(["reading", "table", "media_set"]),
      body: z.record(z.string(), z.unknown()),
    }),
  ),
});

const PersonSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  full_name: z.string().min(1),
});

export const FamiliesSchema = z.object({
  password: z.string().min(8),
  consent_version: z.string().min(1),
  admins: z.array(PersonSchema),
  families: z.array(
    z.strictObject({
      parent: PersonSchema,
      student: z.strictObject({
        profile_id: z.uuid(),
        id: z.uuid(),
        email: z.email(),
        full_name: z.string().min(1),
        grade: z.number().int().min(1).max(12),
        goal: z.enum(["tka", "utbk", "both"]),
        daily_target: z.number().int().min(1).max(50),
      }),
    }),
  ),
});

export type Curriculum = z.infer<typeof CurriculumSchema>;
export type Stimuli = z.infer<typeof StimuliSchema>;
export type Families = z.infer<typeof FamiliesSchema>;

export interface SeedSources {
  curriculum: unknown;
  stimuli: unknown;
  items: unknown;
  families: unknown;
}

export interface SeedBuild {
  ok: boolean;
  /** The SQL, present only when every check passed. */
  sql?: string;
  /** Human-readable summary or the list of problems, in Indonesian. */
  report: string;
  items: Item[];
}

// --- Helpers ------------------------------------------------------------------------------------

/**
 * Deterministic UUID for seed rows, so other seed data, tests, and later phases can refer to them.
 * Same value as Postgres `md5(text)::uuid`. Not a UUID v7: these rows are fixtures, not app data.
 */
export function seedUuid(kind: string, key: string): string {
  const hex = createHash("md5").update(`coreta-seed:${kind}:${key}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** A SQL string literal (standard_conforming_strings on: only quotes need escaping). */
export function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown): string {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function sqlNullable(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "null";
  return typeof value === "number" ? String(value) : sqlString(value);
}

function sqlTextArray(values: readonly string[]): string {
  return values.length === 0
    ? "'{}'::text[]"
    : `array[${values.map(sqlString).join(", ")}]::text[]`;
}

function findCycle(prereqs: readonly (readonly [string, string])[]): string[] | null {
  const graph = new Map<string, string[]>();
  for (const [competency, prereq] of prereqs) {
    graph.set(competency, [...(graph.get(competency) ?? []), prereq]);
  }
  const state = new Map<string, "visiting" | "done">();
  const path: string[] = [];
  const visit = (node: string): string[] | null => {
    if (state.get(node) === "done") return null;
    if (state.get(node) === "visiting") return [...path.slice(path.indexOf(node)), node];
    state.set(node, "visiting");
    path.push(node);
    for (const next of graph.get(node) ?? []) {
      const cycle = visit(next);
      if (cycle) return cycle;
    }
    path.pop();
    state.set(node, "done");
    return null;
  };
  for (const node of graph.keys()) {
    const cycle = visit(node);
    if (cycle) return cycle;
  }
  return null;
}

function formatZodError(file: string, error: z.ZodError): string {
  return `${file}:\n${z.prettifyError(error)}`;
}

// --- Build --------------------------------------------------------------------------------------

/** Validates every seed file (items through validateItem) and returns the seed SQL. */
export function buildSeedSql(sources: SeedSources): SeedBuild {
  const problems: string[] = [];

  const curriculum = CurriculumSchema.safeParse(sources.curriculum);
  const stimuli = StimuliSchema.safeParse(sources.stimuli);
  const families = FamiliesSchema.safeParse(sources.families);
  if (!curriculum.success) problems.push(formatZodError("curriculum.json", curriculum.error));
  if (!stimuli.success) problems.push(formatZodError("stimuli.json", stimuli.error));
  if (!families.success) problems.push(formatZodError("families.json", families.error));

  const imported = importItems(sources.items);
  if (!imported.ok) problems.push(`items.json:\n${formatImportReport(imported)}`);

  if (!curriculum.success || !stimuli.success || !families.success || !imported.ok) {
    return { ok: false, report: problems.join("\n\n"), items: imported.items };
  }

  const { stages, competencies, prereqs } = curriculum.data;
  const stageNumbers = new Set(stages.map((stage) => stage.number));
  const competencyCodes = new Set(competencies.map((competency) => competency.code));
  const stimulusIds = new Set(stimuli.data.stimuli.map((stimulus) => stimulus.id));

  if (stageNumbers.size !== stages.length) problems.push("curriculum.json: nomor tahap kembar.");
  if (competencyCodes.size !== competencies.length) {
    problems.push("curriculum.json: kode kompetensi kembar.");
  }
  for (const competency of competencies) {
    if (!stageNumbers.has(competency.stage)) {
      problems.push(
        `Kompetensi ${competency.code} menunjuk tahap ${competency.stage} yang tidak ada.`,
      );
    }
    if (!competency.code.startsWith(`M${competency.stage}.`)) {
      problems.push(`Kode ${competency.code} tidak cocok dengan tahap ${competency.stage}.`);
    }
  }
  for (const [competency, prereq] of prereqs) {
    for (const code of [competency, prereq]) {
      if (!competencyCodes.has(code))
        problems.push(`Prasyarat menunjuk kompetensi ${code} yang tidak ada.`);
    }
  }
  const cycle = findCycle(prereqs);
  if (cycle) problems.push(`Prasyarat membentuk lingkaran: ${cycle.join(" → ")}.`);

  for (const item of imported.items) {
    if (!competencyCodes.has(item.competency_code)) {
      problems.push(
        `${item.code}: kompetensi ${item.competency_code} tidak ada di curriculum.json.`,
      );
    }
    if (item.stimulus_id && !stimulusIds.has(item.stimulus_id)) {
      problems.push(`${item.code}: stimulus ${item.stimulus_id} tidak ada di stimuli.json.`);
    }
  }

  const people = [
    ...families.data.admins,
    ...families.data.families.flatMap((family) => [
      family.parent,
      { id: family.student.profile_id, email: family.student.email },
    ]),
  ];
  const ids = people.map((person) => person.id);
  const emails = people.map((person) => person.email.toLowerCase());
  if (new Set(ids).size !== ids.length) problems.push("families.json: id pengguna kembar.");
  if (new Set(emails).size !== emails.length) problems.push("families.json: email kembar.");

  if (problems.length > 0) {
    return { ok: false, report: problems.join("\n"), items: imported.items };
  }

  const sql = render(curriculum.data, stimuli.data, imported.items, families.data);
  const published = imported.items.filter((item) => item.status === "published").length;
  const report = [
    `${stages.length} tahap, ${competencies.length} kompetensi, ${prereqs.length} prasyarat.`,
    `${imported.items.length} butir lolos validateItem (${published} terbit, ${imported.items.length - published} draf).`,
    `${stimuli.data.stimuli.length} stimulus, ${families.data.families.length} keluarga, ${families.data.admins.length} admin.`,
  ].join("\n");
  return { ok: true, sql, report, items: imported.items };
}

function render(
  curriculum: Curriculum,
  stimuli: Stimuli,
  items: Item[],
  families: Families,
): string {
  const out: string[] = [];
  const line = (text = "") => out.push(text);

  line("-- Seed pengembangan lokal Coreta (Fase 34).");
  line(
    "-- DIBUAT OTOMATIS oleh `pnpm --filter @coreta/content seed:sql` dari packages/content/seed/*.json.",
  );
  line("-- Jangan diubah langsung: ubah berkas JSON-nya, lalu jalankan ulang perintah itu.");
  line("--");
  line(
    "-- Dimuat oleh `supabase db reset`. JANGAN dijalankan di proyek produksi: akun contoh memakai",
  );
  line("-- kata sandi yang sederhana dan tercatat di repositori.");
  line();

  // Curriculum ------------------------------------------------------------------------------------
  line("-- Kurikulum: Tahap 0-8, kompetensi inti, prasyarat");
  line("insert into public.stages (id, number, name, goal_scope) values");
  line(
    curriculum.stages
      .map(
        (stage) =>
          `  (${sqlString(seedUuid("stage", String(stage.number)))}, ${stage.number}, ${sqlString(stage.name)}, ${sqlString(stage.goal_scope)})`,
      )
      .join(",\n") + ";",
  );
  line();
  line("insert into public.competencies (id, code, stage_id, domain, name, exam_tags) values");
  line(
    curriculum.competencies
      .map(
        (competency) =>
          `  (${sqlString(seedUuid("competency", competency.code))}, ${sqlString(competency.code)}, ${sqlString(seedUuid("stage", String(competency.stage)))}, ${sqlString(competency.domain)}, ${sqlString(competency.name)}, ${sqlTextArray(competency.exam_tags)})`,
      )
      .join(",\n") + ";",
  );
  line();
  line("insert into public.competency_prereqs (competency_id, prereq_id) values");
  line(
    curriculum.prereqs
      .map(
        ([competency, prereq]) =>
          `  (${sqlString(seedUuid("competency", competency))}, ${sqlString(seedUuid("competency", prereq))})`,
      )
      .join(",\n") + ";",
  );
  line();

  // Stimuli and media -----------------------------------------------------------------------------
  line("-- Stimulus bacaan");
  line("insert into public.stimuli (id, kind, body) values");
  line(
    stimuli.stimuli
      .map(
        (stimulus) =>
          `  (${sqlString(seedUuid("stimulus", stimulus.id))}, ${sqlString(stimulus.kind)}, ${sqlJson(stimulus.body)})`,
      )
      .join(",\n") + ";",
  );
  line();

  const media = items.flatMap((item) => item.media.map((entry) => ({ item, entry })));
  if (media.length > 0) {
    line(
      "-- Media soal. Berkasnya belum diunggah ke Storage; storage_path = {item_id}/{media_id}.",
    );
    line(
      "insert into public.media_assets (id, kind, storage_path, alt_text, transcript, pasteable) values",
    );
    line(
      media
        .map(
          ({ item, entry }) =>
            `  (${sqlString(seedUuid("media", entry.id))}, ${sqlString(entry.kind)}, ${sqlString(`${seedUuid("item", item.code)}/${entry.id}`)}, ${sqlString(entry.alt_text)}, ${sqlNullable(entry.transcript)}, ${entry.pasteable ? "true" : "false"})`,
        )
        .join(",\n") + ";",
    );
    line();
  }

  // Items -----------------------------------------------------------------------------------------
  line("-- Butir soal: yang dari mockup terbit, sisanya draf sampai ditinjau manusia");
  line(
    "insert into public.items (id, code, competency_id, tier, answer_type, stem, options, answer_key, equivalents, tolerance, distractor_hints, explanation, layout_mode, stimulus_id, difficulty, status, version) values",
  );
  line(
    items
      .map((item) => {
        const stem: Record<string, unknown> = { text: item.stem.text };
        if (item.stem.formula) stem.formula = item.stem.formula;
        if (item.media.length > 0)
          stem.media_ids = item.media.map((entry) => seedUuid("media", entry.id));
        const options = item.options.map((option) => ({
          id: option.id,
          label: option.label ?? option.id,
          text: option.text,
        }));
        return `  (${[
          sqlString(seedUuid("item", item.code)),
          sqlString(item.code),
          sqlString(seedUuid("competency", item.competency_code)),
          sqlString(item.tier),
          sqlString(item.answer_type),
          sqlJson(stem),
          sqlJson(options),
          sqlJson(item.answer_key),
          sqlJson(item.equivalents ?? []),
          sqlNullable(item.tolerance),
          sqlJson(item.distractor_hints),
          sqlJson(item.explanation),
          sqlString(item.layout_mode),
          item.stimulus_id ? sqlString(seedUuid("stimulus", item.stimulus_id)) : "null",
          String(item.difficulty),
          sqlString(item.status),
          String(item.version),
        ].join(", ")})`;
      })
      .join(",\n") + ";",
  );
  line();

  // Accounts --------------------------------------------------------------------------------------
  line(
    "-- Akun contoh (lokal saja). Profil dibuat trigger on_auth_user_created dari raw_app_meta_data.role.",
  );
  const users = [
    ...families.admins.map((admin) => ({ ...admin, role: "admin" })),
    ...families.families.flatMap((family) => [
      { ...family.parent, role: "parent" },
      {
        id: family.student.profile_id,
        email: family.student.email,
        full_name: family.student.full_name,
        role: "student",
      },
    ]),
  ];
  line(
    "insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values",
  );
  line(
    users
      .map(
        (user) =>
          `  ('00000000-0000-0000-0000-000000000000', ${sqlString(user.id)}, 'authenticated', 'authenticated', ${sqlString(user.email)}, extensions.crypt(${sqlString(families.password)}, extensions.gen_salt('bf')), now(), ${sqlJson({ provider: "email", providers: ["email"], role: user.role })}, ${sqlJson({ full_name: user.full_name })}, now(), now(), '', '', '', '')`,
      )
      .join(",\n") + ";",
  );
  line();
  line(
    "insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values",
  );
  line(
    users
      .map(
        (user) =>
          `  (${sqlString(user.id)}, ${sqlString(user.id)}, ${sqlString(user.id)}, ${sqlJson({ sub: user.id, email: user.email, email_verified: true })}, 'email', now(), now(), now())`,
      )
      .join(",\n") + ";",
  );
  line();
  line("insert into public.students (id, profile_id, grade, goal, daily_target) values");
  line(
    families.families
      .map(
        ({ student }) =>
          `  (${sqlString(student.id)}, ${sqlString(student.profile_id)}, ${student.grade}, ${sqlString(student.goal)}, ${student.daily_target})`,
      )
      .join(",\n") + ";",
  );
  line();
  line(
    "insert into public.guardianships (parent_id, student_id, consent_at, consent_version) values",
  );
  line(
    families.families
      .map(
        ({ parent, student }) =>
          `  (${sqlString(parent.id)}, ${sqlString(student.id)}, now(), ${sqlString(families.consent_version)})`,
      )
      .join(",\n") + ";",
  );
  line();
  line("insert into public.consents (parent_id, type, granted, version) values");
  line(
    families.families
      .map(
        ({ parent }) =>
          `  (${sqlString(parent.id)}, 'data_anak', true, ${sqlString(families.consent_version)})`,
      )
      .join(",\n") + ";",
  );

  return `${out.join("\n")}\n`;
}
