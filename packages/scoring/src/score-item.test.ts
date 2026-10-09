import { afterEach, describe, expect, it, vi } from "vitest";

import { type Answer, type Item, scoreItem } from "./index";

const pgItem: Item = {
  type: "pg",
  key: "b",
  options: [{ id: "a", hint: "Hint A" }, { id: "b" }],
};

const pgkItem: Item = {
  type: "pgk",
  keys: ["a", "b"],
  options: [{ id: "a" }, { id: "b" }, { id: "c", hint: "Hint C" }],
};

const isianItem: Item = { type: "isian", key: "0,75", tolerance: 0 };

const bsItem: Item = {
  type: "bs",
  rows: [
    { id: "r1", key: true },
    { id: "r2", key: false, hint: "Hint R2" },
  ],
};

describe("scoreItem", () => {
  it("scores pg and bs items through the same entry point", () => {
    expect(scoreItem(pgItem, { type: "pg", choice: "b" }).score).toBe(1);
    expect(scoreItem(bsItem, { type: "bs", rows: { r1: true, r2: true } }).score).toBe(0.5);
  });

  it("scores pgk items, including the select-everything safeguard", () => {
    expect(scoreItem(pgkItem, { type: "pgk", choices: ["a", "b"] }).score).toBe(1);
    expect(scoreItem(pgkItem, { type: "pgk", choices: ["a", "b", "c"] }).score).toBe(0);
  });

  it("scores isian items through normalization", () => {
    expect(scoreItem(isianItem, { type: "isian", text: "3/4" }).score).toBe(1);
    expect(scoreItem(isianItem, { type: "isian", text: "" }).score).toBe(0);
  });

  it("scores 0 with no hints when the answer type does not match the item", () => {
    const empty = { score: 0, correct: false, hints: [] };
    expect(scoreItem(pgkItem, { type: "pg", choice: "a" })).toEqual(empty);
    expect(scoreItem(isianItem, { type: "pg", choice: "a" })).toEqual(empty);
    expect(scoreItem(pgItem, { type: "bs", rows: { r1: true } })).toEqual(empty);
    expect(scoreItem(bsItem, { type: "pg", choice: "a" })).toEqual(empty);
  });
});

// Scoring runs on the server and in the worker; it must be a pure function (TIP, phase 20).
describe("scoreItem purity", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const cases: [Item, Answer][] = [
    [pgItem, { type: "pg", choice: "a" }],
    [pgkItem, { type: "pgk", choices: ["a", "c"] }],
    [bsItem, { type: "bs", rows: { r1: false, r2: true } }],
    [isianItem, { type: "isian", text: "Rp 60 ribu" }],
  ];

  it.each(cases)("does not read the clock, randomness, or the network", (item, answer) => {
    const random = vi.spyOn(Math, "random");
    const fetchSpy = vi.fn(() => {
      throw new Error("network used");
    });
    vi.stubGlobal("fetch", fetchSpy);
    vi.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
    const first = scoreItem(item, answer);
    vi.setSystemTime(new Date("2031-06-15T12:34:56Z"));
    const second = scoreItem(item, answer);

    expect(second).toEqual(first);
    expect(random).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each(cases)("does not modify its inputs", (item, answer) => {
    const deepFreeze = <T>(value: T): T => {
      if (typeof value === "object" && value !== null) {
        Object.values(value).forEach(deepFreeze);
        Object.freeze(value);
      }
      return value;
    };
    // Writing to a frozen object throws in strict mode, so scoring would fail if it mutated.
    const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
    expect(() => scoreItem(deepFreeze(clone(item)), deepFreeze(clone(answer)))).not.toThrow();
  });

  it("returns a fresh result each call, so callers cannot corrupt a shared one", () => {
    const a = scoreItem(pgItem, { type: "pg", choice: "a" });
    a.hints.push({ targetId: "x", text: "tampered" });
    expect(scoreItem(pgItem, { type: "pg", choice: "a" }).hints).toHaveLength(1);
  });
});
