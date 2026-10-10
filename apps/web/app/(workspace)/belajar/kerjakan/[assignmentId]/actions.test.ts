import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: null as { id: string; role: string } | null,
  keys: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session-server", () => ({ currentUser: async () => mocks.user }));
vi.mock("@/lib/queries/student", () => ({ getAnswerKeysForAssignment: mocks.keys }));

import { gradeWorksheet } from "./actions";

const assignmentId = "0195f000-0000-7000-8000-000000000001";
const pgRow = {
  id: "i1",
  answer_type: "pg",
  options: [{ id: "a" }, { id: "b" }],
  answer_key: ["a"],
  equivalents: [],
  tolerance: null,
  distractor_hints: { b: "Petunjuk B" },
};

beforeEach(() => {
  mocks.user = { id: "u", role: "siswa" };
  mocks.keys.mockReset().mockResolvedValue([pgRow]);
});

describe("gradeWorksheet", () => {
  it("menilai di server dan hanya mengembalikan skor dan petunjuk", async () => {
    const result = await gradeWorksheet({
      assignmentId,
      answers: { i1: { type: "pg", choice: "b" } },
      elapsedSeconds: 90,
    });
    expect(result).toMatchObject({ assignmentId, overallScore: 0, durationSeconds: 90 });
    expect(result.results.i1).toEqual({
      score: 0,
      correct: false,
      hints: [{ targetId: "b", text: "Petunjuk B" }],
    });
    expect(JSON.stringify(result)).not.toContain("answer_key");
  });

  it("menerima id seed berbentuk md5 (bukan UUID v4/v7)", async () => {
    await gradeWorksheet({
      assignmentId: "563b7fbb-5afd-2132-61c5-c07793534037",
      answers: {},
      elapsedSeconds: 0,
    });
    expect(mocks.keys).toHaveBeenCalledWith("563b7fbb-5afd-2132-61c5-c07793534037");
  });

  it("NEGATIF: hanya siswa yang bisa mengirim", async () => {
    for (const user of [null, { id: "p", role: "ortu" }, { id: "a", role: "admin" }]) {
      mocks.user = user;
      await expect(
        gradeWorksheet({ assignmentId, answers: {}, elapsedSeconds: 0 }),
      ).rejects.toThrow();
    }
    expect(mocks.keys).not.toHaveBeenCalled();
  });

  it("NEGATIF: penugasan orang lain (tidak terbaca lewat RLS) ditolak", async () => {
    mocks.keys.mockResolvedValue(null);
    await expect(gradeWorksheet({ assignmentId, answers: {}, elapsedSeconds: 0 })).rejects.toThrow(
      "Penugasan tidak ditemukan.",
    );
  });

  it("NEGATIF: id dan jawaban yang tidak sah ditolak sebelum membaca kunci", async () => {
    await expect(
      gradeWorksheet({ assignmentId: "bukan-uuid", answers: {}, elapsedSeconds: 0 }),
    ).rejects.toThrow();
    await expect(
      gradeWorksheet({
        assignmentId,
        answers: { i1: { type: "pg", choice: 1 } },
        elapsedSeconds: 0,
      }),
    ).rejects.toThrow();
    expect(mocks.keys).not.toHaveBeenCalled();
  });
});
