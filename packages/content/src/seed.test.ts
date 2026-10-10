import { readFileSync } from "node:fs";

import { type Item as ScoringItem, scoreItem } from "@coreta/scoring";
import { describe, expect, it } from "vitest";

import type { Item } from "./schema";
import { buildSeedSql, dropEmptyInserts, seedUuid, sqlString } from "./seed-sql";
import { formatErrors, validateItem } from "./validate";

const seedDir = new URL("../seed/", import.meta.url);
const read = (name: string): unknown => JSON.parse(readFileSync(new URL(name, seedDir), "utf8"));
const sources = {
  curriculum: read("curriculum.json"),
  stimuli: read("stimuli.json"),
  items: read("items.json"),
  families: read("families.json"),
  learning: read("learning.json"),
};
const rawItems = (sources.items as { items: unknown[] }).items;
const build = buildSeedSql(sources);
const items = build.items;

const MOCKUP_CODES = [
  "MAT-SMA-ALJ-01",
  "MAT-SMA-GEO-02",
  "MAT-SMA-LIT-03",
  "MAT-SMA-ALJ-04",
  "MAT-SMA-MAT-05",
  "MAT-SMA-LIT-06",
  "MAT-SMA-DIM-07",
  "MAT-SMA-STA-08",
];

function toScoring(item: Item): ScoringItem {
  const hint = (id: string) => item.distractor_hints[id];
  switch (item.answer_type) {
    case "pg":
      return {
        type: "pg",
        key: item.answer_key[0] ?? "",
        options: item.options.map((o) => ({ id: o.id, hint: hint(o.id) })),
      };
    case "pgk":
      return {
        type: "pgk",
        keys: item.answer_key,
        options: item.options.map((o) => ({ id: o.id, hint: hint(o.id) })),
      };
    case "bs":
      return {
        type: "bs",
        rows: item.options.map((o) => ({
          id: o.id,
          key: item.answer_key.includes(o.id),
          hint: hint(o.id),
        })),
      };
    case "isian":
      return {
        type: "isian",
        key: item.answer_key[0] ?? "",
        equivalents: item.equivalents,
        tolerance: item.tolerance,
      };
  }
}

describe("seed items (DoD: semua butir seed lolos validateItem)", () => {
  it("has 40 items", () => {
    expect(rawItems).toHaveLength(40);
  });

  it.each(rawItems.map((raw) => [(raw as { code: string }).code, raw]))(
    "%s lolos validateItem",
    (_code, raw) => {
      const result = validateItem(raw);
      expect(result.ok, result.ok ? "" : formatErrors(result.errors)).toBe(true);
    },
  );

  it("publishes exactly the 8 mockup items and keeps the rest as draft", () => {
    expect(items.filter((i) => i.status === "published").map((i) => i.code)).toEqual(MOCKUP_CODES);
    expect(items.filter((i) => i.status === "draft")).toHaveLength(32);
  });

  it("covers every answer type, tier, and layout", () => {
    expect(new Set(items.map((i) => i.answer_type))).toEqual(new Set(["pg", "pgk", "bs", "isian"]));
    expect(new Set(items.map((i) => i.tier))).toEqual(new Set(["dasar", "mahir", "ujian"]));
    expect(new Set(items.map((i) => i.layout_mode))).toEqual(
      new Set(["standar", "media", "bacaan"]),
    );
  });
});

describe("answer keys agree with @coreta/scoring", () => {
  it.each(items.map((item) => [item.code, item]))("%s: the key scores 1", (_code, item) => {
    const scoring = toScoring(item);
    const answer =
      scoring.type === "pg"
        ? { type: "pg" as const, choice: scoring.key }
        : scoring.type === "pgk"
          ? { type: "pgk" as const, choices: scoring.keys }
          : scoring.type === "bs"
            ? {
                type: "bs" as const,
                rows: Object.fromEntries(scoring.rows.map((row) => [row.id, row.key])),
              }
            : { type: "isian" as const, text: scoring.key };
    expect(scoreItem(scoring, answer).score).toBe(1);
  });

  it.each(items.filter((i) => i.answer_type === "pg").map((item) => [item.code, item]))(
    "%s: every distractor scores 0 and shows its hint",
    (_code, item) => {
      for (const option of item.options.filter((o) => !item.answer_key.includes(o.id))) {
        const result = scoreItem(toScoring(item), { type: "pg", choice: option.id });
        expect(result.score).toBe(0);
        expect(result.hints.map((h) => h.text)).toContain(item.distractor_hints[option.id]);
      }
    },
  );

  it.each(items.filter((i) => i.answer_type === "isian").map((item) => [item.code, item]))(
    "%s: every listed equivalent scores 1",
    (_code, item) => {
      for (const text of item.equivalents ?? []) {
        expect(scoreItem(toScoring(item), { type: "isian", text }).score, text).toBe(1);
      }
    },
  );
});

describe("buildSeedSql", () => {
  it("accepts the seed files", () => {
    expect(build.ok, build.report).toBe(true);
    expect(build.report).toContain("40 butir lolos validateItem (8 terbit, 32 draf)");
  });

  it("matches the committed supabase/seed.sql (run `pnpm --filter @coreta/content seed:sql`)", () => {
    const committed = readFileSync(new URL("../../../supabase/seed.sql", import.meta.url), "utf8");
    expect(committed).toBe(build.sql);
  });

  it("refuses an invalid item and names the problem", () => {
    const broken = structuredClone(sources) as typeof sources & { items: { items: unknown[] } };
    (broken.items.items[0] as { explanation: { text: string } }).explanation.text = "";
    const result = buildSeedSql(broken);
    expect(result.ok).toBe(false);
    expect(result.sql).toBeUndefined();
    expect(result.report).toContain("Pembahasan belum ditulis");
  });

  it("refuses an unknown competency code", () => {
    const broken = structuredClone(sources) as typeof sources & { items: { items: unknown[] } };
    (broken.items.items[0] as { competency_code: string }).competency_code = "M9.9";
    expect(buildSeedSql(broken).report).toContain("kompetensi M9.9 tidak ada");
  });

  it("refuses prerequisite cycles", () => {
    const broken = structuredClone(sources) as typeof sources & {
      curriculum: { prereqs: [string, string][] };
    };
    broken.curriculum.prereqs.push(["M0.1", "M0.3"]);
    expect(buildSeedSql(broken).report).toContain("Prasyarat membentuk lingkaran");
  });

  it("refuses weak student PINs, malformed login codes, and duplicate codes", () => {
    type Families = { families: { student: { pin: string; login_code: string } }[] };
    const weak = structuredClone(sources) as typeof sources & { families: Families };
    weak.families.families[0].student.pin = "123456";
    expect(buildSeedSql(weak).report).toContain("PIN harus 6 angka");

    const malformed = structuredClone(sources) as typeof sources & { families: Families };
    malformed.families.families[0].student.login_code = "RAKA-4826";
    expect(buildSeedSql(malformed).report).toContain("kode masuk tidak sah");

    const duplicate = structuredClone(sources) as typeof sources & { families: Families };
    duplicate.families.families[1].student.login_code =
      duplicate.families.families[0].student.login_code;
    expect(buildSeedSql(duplicate).report).toContain("kode masuk siswa kembar");
  });

  it("stores student passwords derived from the PIN, never the PIN itself", () => {
    expect(build.sql).toContain("'RAKA4826'");
    expect(build.sql).not.toContain("'482913'");
    expect(build.sql).toContain("@siswa.coreta.invalid");
  });

  it("refuses learning data that points at draft items, unknown worksheets, or double mastery", () => {
    type Learning = {
      worksheets: { items: { code: string; slot: string }[] }[];
      students: { assignments: string[]; mastered_competencies: string[] }[];
    };
    const broken = structuredClone(sources) as typeof sources & { learning: Learning };
    broken.learning.worksheets[0].items.push({ code: "MAT-SMA-BIL-09", slot: "baru" });
    broken.learning.students[0].assignments.push("tidak-ada");
    broken.learning.students[0].mastered_competencies.push("M0.1");
    const report = buildSeedSql(broken).report;
    expect(report).toContain("MAT-SMA-BIL-09 yang tidak ada atau belum terbit");
    expect(report).toContain("worksheet tidak-ada tidak ada");
    expect(report).toContain("M0.1 sudah tuntas lewat mastered_stages");
  });

  it("refuses UTBK-only items for a TKA student and duplicate assignments", () => {
    type Learning = { students: { student_id: string; assignments: string[] }[] };
    const broken = structuredClone(sources) as typeof sources & { learning: Learning };
    const dimas = broken.learning.students.find((student) => student.student_id.endsWith("033"))!;
    dimas.assignments = ["minggu-ini", "minggu-ini"];
    const report = buildSeedSql(broken).report;
    expect(report).toContain("worksheet yang sama ditugaskan dua kali");
    expect(report).toContain("memuat MAT-SMA-LIT-03 khusus utbk");
  });

  it("drops insert statements that have no rows", () => {
    expect(dropEmptyInserts("a;\ninsert into public.x (a) values\n;\nb;\n")).toBe("a;\nb;\n");
    type Learning = { worksheets: unknown[]; students: unknown[] };
    const empty = structuredClone(sources) as typeof sources & { learning: Learning };
    empty.learning.worksheets = [];
    empty.learning.students = [];
    const result = buildSeedSql(empty);
    expect(result.ok).toBe(true);
    expect(result.sql).not.toMatch(/values\n;/);
    expect(result.sql).not.toContain("insert into public.worksheets");
  });

  it("seeds worksheets, assignments, mastery, and daily activity relative to today", () => {
    expect(build.sql).toContain("insert into public.worksheets");
    expect(build.sql).toContain("insert into public.assignments");
    expect(build.sql).toContain("insert into public.mastery");
    expect(build.sql).toContain("(now() at time zone 'Asia/Jakarta')::date - 0");
  });

  it("uses stable ids that match Postgres md5(text)::uuid", () => {
    expect(seedUuid("stage", "0")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(seedUuid("item", "A")).toBe(seedUuid("item", "A"));
    expect(seedUuid("item", "A")).not.toBe(seedUuid("item", "B"));
  });

  it("escapes quotes in SQL strings", () => {
    expect(sqlString("Jum'at")).toBe("'Jum''at'");
  });
});
