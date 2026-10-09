import { describe, expect, it } from "vitest";

import { PGK_INCOMPLETE_HINT, PGK_SELECT_ALL_HINT, scorePgk } from "./pgk";
import type { PgkItem } from "./types";

// Three keys (a, b, c) and two wrong options (d, e).
const item: PgkItem = {
  type: "pgk",
  keys: ["a", "b", "c"],
  options: [
    { id: "a" },
    { id: "b" },
    { id: "c" },
    { id: "d", hint: "Grafik membuka ke atas, bukan ke bawah." },
    { id: "e" },
  ],
};

const score = (choices: string[], target: PgkItem = item) =>
  scorePgk(target, { type: "pgk", choices });

describe("scorePgk scoring", () => {
  it("scores 1 and no hints when exactly the keys are ticked", () => {
    expect(score(["a", "b", "c"])).toEqual({ score: 1, correct: true, hints: [] });
  });

  it("scores 2 of 3 keys without a wrong tick as 0.67", () => {
    const result = score(["a", "c"]);
    expect(result.score).toBeCloseTo(2 / 3, 10);
    expect(result.correct).toBe(false);
  });

  it("does not subtract for a wrong tick: 2 keys plus 1 wrong is still 0.67", () => {
    const withWrong = score(["a", "b", "d"]);
    const without = score(["a", "b"]);
    expect(withWrong.score).toBeCloseTo(2 / 3, 10);
    expect(withWrong.score).toBe(without.score);
  });

  it("scores 0 when nothing is ticked", () => {
    expect(score([]).score).toBe(0);
  });

  it("scores 0 when only wrong options are ticked", () => {
    expect(score(["d", "e"]).score).toBe(0);
  });

  it("scores all keys plus a wrong tick as 1, because wrong ticks never lower the score", () => {
    const result = score(["a", "b", "c", "d"]);
    expect(result.score).toBe(1);
    expect(result.hints).toEqual([
      { targetId: "d", text: "Grafik membuka ke atas, bukan ke bawah." },
    ]);
  });

  it("counts a repeated id once and ignores ids that are not options", () => {
    expect(score(["a", "a", "a", "ghost"]).score).toBeCloseTo(1 / 3, 10);
  });
});

describe("scorePgk safeguard (rule 8)", () => {
  const everything = ["a", "b", "c", "d", "e"];

  it("scores 0 and returns only the safeguard hint when every option is ticked", () => {
    expect(score(everything)).toEqual({
      score: 0,
      correct: false,
      hints: [{ text: PGK_SELECT_ALL_HINT }],
    });
  });

  it("uses the exact safeguard wording", () => {
    expect(PGK_SELECT_ALL_HINT).toBe(
      "Mencentang semua pilihan dihitung salah. Pilih hanya pernyataan yang kamu yakini benar.",
    );
  });

  it("holds whatever the order of the ticks and even with repeated ids", () => {
    expect(score([...everything].reverse()).score).toBe(0);
    expect(score([...everything, "a", "ghost"]).score).toBe(0);
  });

  it("is checked before scoring, so it beats a wrong-option hint", () => {
    const hints = score(everything).hints;
    expect(hints).toHaveLength(1);
    expect(hints[0]?.targetId).toBeUndefined();
  });

  it("does not trigger when one option is left unticked", () => {
    expect(score(["a", "b", "c", "d"]).hints.map((h) => h.text)).not.toContain(PGK_SELECT_ALL_HINT);
  });
});

describe("scorePgk hints", () => {
  it("adds the incomplete hint after the option hints whenever the score is below 1", () => {
    const result = score(["a", "d"]);
    expect(result.hints).toEqual([
      { targetId: "d", text: "Grafik membuka ke atas, bukan ke bawah." },
      { text: PGK_INCOMPLETE_HINT },
    ]);
  });

  it("adds the incomplete hint even when nothing is ticked", () => {
    expect(score([]).hints).toEqual([{ text: PGK_INCOMPLETE_HINT }]);
  });

  it("skips wrong options that have no hint text", () => {
    expect(score(["e"]).hints).toEqual([{ text: PGK_INCOMPLETE_HINT }]);
  });

  it("returns no incomplete hint once every key is ticked", () => {
    expect(score(["a", "b", "c"]).hints).toEqual([]);
  });
});

describe("scorePgk malformed items", () => {
  const bad = (changes: Partial<PgkItem>) => () => score(["a"], { ...item, ...changes });

  it("throws for no keys, repeated keys, repeated options, or a key that is not an option", () => {
    expect(bad({ keys: [] })).toThrow(/kunci/);
    expect(bad({ keys: ["a", "a"] })).toThrow(/kunci/);
    expect(bad({ options: [{ id: "a" }, { id: "a" }, { id: "b" }], keys: ["a"] })).toThrow(
      /kembar/,
    );
    expect(bad({ keys: ["a", "zzz"] })).toThrow(/bukan salah satu opsi/);
  });

  it("throws when every option is a key, since the safeguard would make it unpassable", () => {
    expect(bad({ options: [{ id: "a" }, { id: "b" }], keys: ["a", "b"] })).toThrow(/semua opsi/);
  });
});
