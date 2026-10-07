import { describe, expect, it } from "vitest";

import { normalizeAnswer, scoreIsian } from "./isian";
import type { IsianItem } from "./types";

describe("normalizeAnswer: money and thousands", () => {
  it.each([
    ["60000", 60000],
    ["60.000", 60000],
    ["60 000", 60000],
    ["60 ribu", 60000],
    ["60ribu", 60000],
    ["60rb", 60000],
    ["Rp60.000", 60000],
    ["Rp 60.000", 60000],
    ["Rp. 60.000", 60000],
    ["IDR 60.000", 60000],
    ["Rp60.000,-", 60000],
    ["Rp60 ribu", 60000],
    ["60.000,00", 60000],
    ["60.000 rupiah", 60000],
    ["1.234.567", 1234567],
    ["1,5 juta", 1500000],
    ["2 juta", 2000000],
    ["1jt", 1000000],
    ["2 juta rupiah", 2000000],
  ])("%j → %d", (input, expected) => {
    expect(normalizeAnswer(input)).toBe(expected);
  });
});

describe("normalizeAnswer: decimals, fractions, percent", () => {
  it.each([
    ["0,75", 0.75],
    ["0.75", 0.75],
    ["3/4", 0.75],
    ["3 / 4", 0.75],
    ["75%", 0.75],
    ["75 %", 0.75],
    ["75 persen", 0.75],
    ["7,5%", 0.075],
    ["1 1/2", 1.5],
    ["-3/4", -0.75],
    ["−3/4", -0.75], // typographic minus
    ["-5", -5],
    ["+5", 5],
    ["1,5", 1.5],
    ["1.5", 1.5],
    ["0.500", 0.5],
    ["1.500", 1500], // a dot followed by exactly three digits groups thousands
    ["1.234,5", 1234.5],
    ["1,234.5", 1234.5],
    ["1,000,000", 1000000],
    ["5.", 5],
    [".5", 0.5],
    ["  42  ", 42],
  ])("%j → %d", (input, expected) => {
    expect(normalizeAnswer(input)).toBeCloseTo(expected, 10);
  });
});

describe("normalizeAnswer: registered units", () => {
  it.each([
    ["5 cm", 5],
    ["5cm", 5],
    ["12 kg", 12],
    ["30°", 30],
    ["30 derajat", 30],
    ["9 m²", 9],
    ["9 m2", 9],
    ["60 km/jam", 60],
    ["2 jam", 2],
  ])("%j → %d", (input, expected) => {
    expect(normalizeAnswer(input)).toBe(expected);
  });
});

describe("normalizeAnswer: not a number", () => {
  it.each([
    [""],
    ["   "],
    [null],
    [undefined],
    ["abc"],
    ["enam puluh"],
    ["60 apel"], // unit not registered
    ["x = 6"],
    ["5-3"],
    ["--5"],
    ["1e5"],
    ["Infinity"],
    ["3/0"],
    ["1/2/3"],
    ["12.34.56"],
    ["1,2,3"],
    ["."],
    ["Rp"],
    ["%"],
    ["60 ribu apel"],
    ["9".repeat(101)],
  ])("%j → null", (input) => {
    expect(normalizeAnswer(input)).toBeNull();
  });
});

const item = (changes: Partial<IsianItem> = {}): IsianItem => ({
  type: "isian",
  key: "60000",
  ...changes,
});

const score = (text: string | null | undefined, target: IsianItem = item()) =>
  scoreIsian(target, { type: "isian", text });

describe("scoreIsian", () => {
  it.each(["60.000", "60000", "60 ribu", "Rp60.000", "rp 60 ribu", " 60000 "])(
    "accepts %j for key 60000",
    (text) => {
      expect(score(text)).toEqual({ score: 1, correct: true, hints: [] });
    },
  );

  it.each(["0,75", "3/4", "75%", "0.75", "75 persen"])("accepts %j for key 0,75", (text) => {
    expect(score(text, item({ key: "0,75" })).score).toBe(1);
  });

  it("scores 0 for a different number", () => {
    expect(score("60001")).toEqual({ score: 0, correct: false, hints: [] });
    expect(score("6000")).toEqual({ score: 0, correct: false, hints: [] });
  });

  it.each([[""], ["   "], [null], [undefined], ["enam puluh ribu"], ["abc"], ["60 apel"]])(
    "scores 0 without an error for %j",
    (text) => {
      expect(score(text)).toEqual({ score: 0, correct: false, hints: [] });
    },
  );

  it("is exact by default, with no tolerance", () => {
    expect(score("59999.99")).toMatchObject({ score: 0 });
    expect(score("3,14", item({ key: "3,14" })).score).toBe(1);
    expect(score("3,141", item({ key: "3,14" })).score).toBe(0);
  });

  it("accepts answers within the tolerance, boundary included", () => {
    const loose = item({ key: "3,14", tolerance: 0.01 });
    expect(score("3,15", loose).score).toBe(1);
    expect(score("3,13", loose).score).toBe(1);
    expect(score("3,16", loose).score).toBe(0);
  });

  it("does not let floating-point noise fail an exact match", () => {
    expect(score("7,3 juta", item({ key: "7300000" })).score).toBe(1);
    expect(score("0,1", item({ key: "1/10" })).score).toBe(1);
  });

  it("accepts equivalents, numeric or textual", () => {
    const target = item({ key: "6", equivalents: ["x = 6", "enam", "6,0"] });
    expect(score("x=6", target).score).toBe(1);
    expect(score("X = 6", target).score).toBe(1);
    expect(score("enam", target).score).toBe(1);
    expect(score("tujuh", target).score).toBe(0);
  });

  it("never matches a blank answer, even against a blank equivalent", () => {
    expect(score("", item({ key: "6", equivalents: [""] })).score).toBe(0);
  });

  it("applies the tolerance to numeric equivalents too", () => {
    const target = item({ key: "10", equivalents: ["20"], tolerance: 1 });
    expect(score("19,5", target).score).toBe(1);
    expect(score("15", target).score).toBe(0);
  });

  it("throws for a key that is not a number or a negative tolerance", () => {
    expect(() => score("5", item({ key: "lima" }))).toThrow(/bukan angka/);
    expect(() => score("5", item({ key: "5", tolerance: -1 }))).toThrow(/toleransi/);
    expect(() => score("5", item({ key: "5", tolerance: Number.NaN }))).toThrow(/toleransi/);
  });
});
