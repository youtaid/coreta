import { describe, expect, it } from "vitest";

import { scorePg } from "./pg";
import type { PgItem } from "./types";

const item: PgItem = {
  type: "pg",
  key: "b",
  options: [
    { id: "a", hint: "Periksa tanda saat memindahkan suku." },
    { id: "b" },
    { id: "c", hint: "Dua titik berlainan berarti D > 0." },
    { id: "d" },
  ],
};

describe("scorePg", () => {
  it("scores 1 with no hints when the key is chosen", () => {
    expect(scorePg(item, { type: "pg", choice: "b" })).toEqual({
      score: 1,
      correct: true,
      hints: [],
    });
  });

  it.each([
    ["a", [{ targetId: "a", text: "Periksa tanda saat memindahkan suku." }]],
    ["c", [{ targetId: "c", text: "Dua titik berlainan berarti D > 0." }]],
  ])("scores 0 and returns the hint of the wrong option %s", (choice, hints) => {
    expect(scorePg(item, { type: "pg", choice })).toEqual({ score: 0, correct: false, hints });
  });

  it("scores 0 without a hint when the wrong option has none", () => {
    expect(scorePg(item, { type: "pg", choice: "d" })).toEqual({
      score: 0,
      correct: false,
      hints: [],
    });
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an empty string", ""],
    ["an id that is not an option", "z"],
  ])("scores 0 with no hints for %s", (_label, choice) => {
    expect(scorePg(item, { type: "pg", choice })).toEqual({
      score: 0,
      correct: false,
      hints: [],
    });
  });

  it("scores 0 when the answer has no choice field at all", () => {
    expect(scorePg(item, { type: "pg" }).score).toBe(0);
  });

  it("throws for an item whose key is not one of its options", () => {
    expect(() => scorePg({ ...item, key: "x" }, { type: "pg", choice: "a" })).toThrow(/kunci/);
  });
});
