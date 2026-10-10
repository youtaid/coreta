import { describe, expect, it } from "vitest";

import {
  type AssignmentRow,
  buildPathStages,
  pickNextWorksheet,
  toWorkspaceQuestions,
  toWorksheetSummary,
} from "./mappers";

const stages = [
  { id: "s0", number: 0, name: "Bilangan", goal_scope: "all" },
  { id: "s1", number: 1, name: "Linear", goal_scope: "all" },
  { id: "s2", number: 2, name: "Fungsi", goal_scope: "all" },
  { id: "s8", number: 8, name: "Penalaran", goal_scope: "utbk" },
];
const competencies = [
  { id: "c0a", stage_id: "s0" },
  { id: "c0b", stage_id: "s0" },
  { id: "c1a", stage_id: "s1" },
  { id: "c1b", stage_id: "s1" },
  { id: "c2a", stage_id: "s2" },
  { id: "c8a", stage_id: "s8" },
];
const mastered = (...ids: string[]) =>
  ids.map((id) => ({ competency_id: id, mastered_at: "2026-10-01T00:00:00Z" }));

describe("buildPathStages", () => {
  it("tahap tuntas, lalu satu tahap aktif dengan progresnya, sisanya terkunci", () => {
    const path = buildPathStages(stages, competencies, mastered("c0a", "c0b", "c1a"), "both");
    expect(path.map((stage) => [stage.number, stage.status, stage.progress])).toEqual([
      [0, "mastered", 1],
      [1, "active", 0.5],
      [2, "locked", 0],
      [8, "locked", 0],
    ]);
  });

  it("kompetensi yang belum tuntas (mastered_at kosong) tidak dihitung", () => {
    const path = buildPathStages(
      stages,
      competencies,
      [{ competency_id: "c0a", mastered_at: null }],
      "both",
    );
    expect(path[0]).toMatchObject({ status: "active", progress: 0 });
  });

  it("tahap khusus UTBK tidak tampil untuk siswa TKA", () => {
    expect(buildPathStages(stages, competencies, [], "tka").map((s) => s.number)).toEqual([
      0, 1, 2,
    ]);
    expect(buildPathStages(stages, competencies, [], "utbk")).toHaveLength(4);
  });

  it("tahap yang tuntas setelah tahap aktif tetap terkunci, urutan mengikuti nomor tahap", () => {
    const path = buildPathStages([...stages].reverse(), competencies, mastered("c2a"), "both");
    expect(path.map((stage) => stage.status)).toEqual(["active", "locked", "locked", "locked"]);
  });
});

const now = new Date("2026-10-10T08:00:00Z");
function assignment(overrides: Partial<AssignmentRow> = {}): AssignmentRow {
  return {
    id: "a1",
    completed_at: null,
    worksheets: {
      title: "Worksheet Minggu Ini",
      release_at: "2026-10-08T00:00:00Z",
      stages: { number: 3, name: "Persamaan Kuadrat" },
      worksheet_items: [
        { slot: "baru", item_id: "i1" },
        { slot: "adaptif", item_id: "i2" },
        { slot: "ulang", item_id: "i3" },
        { slot: "ulang", item_id: "i4" },
      ],
    },
    attempts: [],
    ...overrides,
  };
}

describe("toWorksheetSummary", () => {
  it("worksheet baru minggu ini", () => {
    expect(toWorksheetSummary(assignment(), now)).toEqual({
      id: "a1",
      title: "Worksheet Minggu Ini",
      stageNumber: 3,
      stageName: "Tahap 3 · Persamaan Kuadrat",
      itemCount: 4,
      answeredCount: 0,
      estimatedMinutes: 12,
      status: "new",
      dueLabel: "Minggu ini",
    });
  });

  it("sedang dikerjakan: butir berbeda yang sudah dijawab, percobaan ulang tidak dihitung dua kali", () => {
    const summary = toWorksheetSummary(
      assignment({
        attempts: [
          { item_id: "i1", try_no: 1, score: 0 },
          { item_id: "i1", try_no: 2, score: 1 },
          { item_id: "i2", try_no: 1, score: 1 },
        ],
      }),
      now,
    );
    expect(summary).toMatchObject({ status: "in_progress", answeredCount: 2 });
  });

  it("selesai: skor = rata-rata percobaan pertama, tanpa label tenggat", () => {
    const summary = toWorksheetSummary(
      assignment({
        completed_at: "2026-10-09T00:00:00Z",
        attempts: [
          { item_id: "i1", try_no: 1, score: 1 },
          { item_id: "i2", try_no: 1, score: 0.5 },
          { item_id: "i3", try_no: 1, score: 0 },
          { item_id: "i3", try_no: 2, score: 1 },
          { item_id: "i4", try_no: 1, score: 1 },
        ],
      }),
      now,
    );
    expect(summary).toMatchObject({ status: "completed", score: 0.625 });
    expect(summary?.dueLabel).toBeUndefined();
  });

  it("worksheet yang semua butirnya ulang berjarak masuk kelompok ulang", () => {
    const row = assignment();
    row.worksheets!.worksheet_items = [{ slot: "ulang", item_id: "i3" }];
    expect(toWorksheetSummary(row, now)).toMatchObject({ status: "review", dueLabel: "Hari ini" });
  });

  it("worksheet yang belum terbit (tidak terbaca karena RLS) tidak tampil", () => {
    expect(toWorksheetSummary(assignment({ worksheets: null }), now)).toBeNull();
  });

  it("pickNextWorksheet mendahulukan yang sedang dikerjakan", () => {
    const list = [
      toWorksheetSummary(assignment({ id: "baru" }), now)!,
      toWorksheetSummary(
        assignment({ id: "jalan", attempts: [{ item_id: "i1", try_no: 1, score: 1 }] }),
        now,
      )!,
    ];
    expect(pickNextWorksheet(list)?.id).toBe("jalan");
    expect(pickNextWorksheet([list[0]])?.id).toBe("baru");
    expect(pickNextWorksheet([])).toBeUndefined();
  });
});

describe("toWorkspaceQuestions", () => {
  const lookups = {
    competencyNames: new Map([["k1", "Diskriminan & jenis akar"]]),
    media: new Map([
      [
        "m1",
        {
          id: "m1",
          kind: "diagram",
          alt_text: "Grafik parabola",
          transcript: null,
          pasteable: true,
        },
      ],
    ]),
    stimuli: new Map([
      [
        "st1",
        {
          id: "st1",
          kind: "reading",
          body: { title: "Batik", text: "Isi bacaan", source: "Kajian" },
        },
      ],
    ]),
  };
  const base = {
    competency_id: "k1",
    tier: "mahir",
    layout_mode: "standar",
    stimulus_id: null,
    options: [],
  };
  const questions = toWorkspaceQuestions(
    [
      {
        ...base,
        id: "i1",
        code: "A-01",
        answer_type: "pg",
        stem: { text: "Soal 1", formula: "x^2", media_ids: ["m1"] },
        options: [{ id: "a", label: "A", text: "k < 3" }],
        layout_mode: "media",
      },
      {
        ...base,
        id: "i2",
        code: "A-02",
        answer_type: "bs",
        stem: { text: "Soal 2" },
        options: [{ id: "r1", label: "1", text: "Pernyataan" }],
      },
      {
        ...base,
        id: "i3",
        code: "A-03",
        answer_type: "isian",
        stem: { text: "Soal 3" },
        stimulus_id: "st1",
        layout_mode: "bacaan",
      },
    ],
    lookups,
  );

  it("memetakan nomor, kompetensi, rumus, dan opsi PG", () => {
    expect(questions[0]).toMatchObject({
      id: "i1",
      number: 1,
      totalQuestions: 3,
      competencyName: "Diskriminan & jenis akar",
      tier: "mahir",
      prompt: "Soal 1",
      formula: "x^2",
      options: [{ id: "a", label: "A", text: "k < 3" }],
      media: { id: "m1", kind: "diagram", altText: "Grafik parabola", pasteable: true },
    });
  });

  it("benar-salah memakai pernyataan, isian memakai placeholder, bacaan memakai stimulus", () => {
    expect(questions[1]).toMatchObject({
      answerType: "bs",
      statements: [{ id: "r1", text: "Pernyataan" }],
    });
    expect(questions[1]?.options).toBeUndefined();
    expect(questions[2]).toMatchObject({
      answerType: "isian",
      layoutMode: "bacaan",
      stimulus: { id: "st1", title: "Batik", bodyText: "Isi bacaan", source: "Kajian" },
    });
    expect(questions[2]?.placeholder).toBeTruthy();
  });

  it("NEGATIF: data tambahan pada baris (mis. kunci yang bocor) tidak ikut ke soal", () => {
    const [question] = toWorkspaceQuestions(
      [
        {
          ...base,
          id: "x",
          code: "X-01",
          answer_type: "pg",
          stem: { text: "S", answer_key: ["a"] },
          options: [{ id: "a", label: "A", text: "1", hint: "rahasia", correct: true }],
          answer_key: ["a"],
        } as never,
      ],
      lookups,
    );
    const json = JSON.stringify(question);
    expect(json).not.toContain("answer_key");
    expect(json).not.toContain("rahasia");
    expect(json).not.toContain("correct");
  });
});
