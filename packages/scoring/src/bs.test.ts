import { describe, expect, it } from "vitest";

import { scoreBs } from "./bs";
import type { BsItem } from "./types";

const item: BsItem = {
  type: "bs",
  rows: [
    { id: "r1", key: true, hint: "Diskriminan positif berarti dua akar berbeda." },
    { id: "r2", key: false, hint: "Parabola dengan a > 0 membuka ke atas." },
    { id: "r3", key: true },
    { id: "r4", key: false, hint: "Sumbu simetri berada di x = −b / 2a." },
  ],
};

describe("scoreBs", () => {
  it("scores 1 when every row is right", () => {
    const result = scoreBs(item, {
      type: "bs",
      rows: { r1: true, r2: false, r3: true, r4: false },
    });
    expect(result).toEqual({ score: 1, correct: true, hints: [] });
  });

  it("scores 0.75 when 3 of 4 rows are right and hints the wrong row", () => {
    const result = scoreBs(item, { type: "bs", rows: { r1: true, r2: true, r3: true, r4: false } });
    expect(result.score).toBe(0.75);
    expect(result.correct).toBe(false);
    expect(result.hints).toEqual([
      { targetId: "r2", text: "Parabola dengan a > 0 membuka ke atas." },
    ]);
  });

  it("scores 0 when every row is wrong, with hints in item order", () => {
    const result = scoreBs(item, {
      type: "bs",
      rows: { r1: false, r2: true, r3: false, r4: true },
    });
    expect(result.score).toBe(0);
    expect(result.hints.map((h) => h.targetId)).toEqual(["r1", "r2", "r4"]); // r3 has no hint
  });

  it("does not round the score", () => {
    const three: BsItem = { type: "bs", rows: item.rows.slice(0, 3) };
    const result = scoreBs(three, { type: "bs", rows: { r1: true, r2: false, r3: false } });
    expect(result.score).toBeCloseTo(2 / 3, 10);
    expect(result.score).not.toBe(0.67);
  });

  it("counts an unanswered row as wrong but gives no hint for it", () => {
    const result = scoreBs(item, { type: "bs", rows: { r1: true, r3: true, r4: false } });
    expect(result.score).toBe(0.75);
    expect(result.hints).toEqual([]);
  });

  it("treats null and undefined marks as unanswered", () => {
    const result = scoreBs(item, {
      type: "bs",
      rows: { r1: null, r2: undefined, r3: true, r4: false },
    });
    expect(result.score).toBe(0.5);
    expect(result.hints).toEqual([]);
  });

  it("scores 0 with no hints when nothing was answered", () => {
    expect(scoreBs(item, { type: "bs", rows: {} })).toEqual({
      score: 0,
      correct: false,
      hints: [],
    });
  });

  it("ignores answers for rows the item does not have", () => {
    const result = scoreBs(item, {
      type: "bs",
      rows: { r1: true, r2: false, r3: true, r4: false, ghost: true },
    });
    expect(result.score).toBe(1);
  });

  it("throws for an item with no rows or with repeated row ids", () => {
    expect(() => scoreBs({ type: "bs", rows: [] }, { type: "bs", rows: {} })).toThrow(/baris/);
    expect(() =>
      scoreBs(
        {
          type: "bs",
          rows: [
            { id: "x", key: true },
            { id: "x", key: false },
          ],
        },
        { type: "bs", rows: { x: true } },
      ),
    ).toThrow(/kembar/);
  });
});
