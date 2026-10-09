import { describe, expect, it } from "vitest";

import type { ActivityDay, Stage } from "./domain";
import { countMastered, dailyTargetProgress, findCurrentStage, goalStreak } from "./learning-path";
import { TODAY, dailyGoal, nextWorksheet, pathActivity, pathStages, todayCount } from "./mock/path";

const stage = (number: number, status: Stage["status"]): Stage => ({
  number,
  name: `Tahap ${number}`,
  status,
  progress: status === "mastered" ? 1 : 0,
});

describe("findCurrentStage", () => {
  it("prefers the active stage", () => {
    expect(
      findCurrentStage([stage(0, "mastered"), stage(1, "active"), stage(2, "locked")]),
    ).toEqual(stage(1, "active"));
  });

  it("falls back to the first stage that is not mastered", () => {
    expect(findCurrentStage([stage(0, "mastered"), stage(1, "locked")])?.number).toBe(1);
  });

  it("returns undefined when every stage is mastered", () => {
    expect(findCurrentStage([stage(0, "mastered"), stage(1, "mastered")])).toBeUndefined();
  });
});

describe("countMastered", () => {
  it("counts only mastered stages", () => {
    expect(countMastered([stage(0, "mastered"), stage(1, "active"), stage(2, "locked")])).toBe(1);
  });
});

describe("dailyTargetProgress", () => {
  it.each([
    [0, 6, { done: 0, goal: 6, remaining: 6, ratio: 0, reached: false }],
    [3, 6, { done: 3, goal: 6, remaining: 3, ratio: 0.5, reached: false }],
    [6, 6, { done: 6, goal: 6, remaining: 0, ratio: 1, reached: true }],
    [9, 6, { done: 9, goal: 6, remaining: 0, ratio: 1, reached: true }],
  ])("%d of %d", (done, goal, expected) => {
    expect(dailyTargetProgress(done, goal)).toEqual(expected);
  });

  it("guards against negative counts and a zero goal", () => {
    expect(dailyTargetProgress(-2, 0)).toEqual({
      done: 0,
      goal: 1,
      remaining: 1,
      ratio: 0,
      reached: false,
    });
  });
});

describe("goalStreak", () => {
  const days: ActivityDay[] = [
    { date: "2026-10-01", count: 6 },
    { date: "2026-10-02", count: 0 },
    { date: "2026-10-03", count: 7 },
    { date: "2026-10-04", count: 6 },
    { date: "2026-10-05", count: 2 },
  ];

  it("counts back from today while the goal is met", () => {
    expect(goalStreak(days, 6, "2026-10-04")).toBe(2);
  });

  it("keeps yesterday's streak when today is not finished yet", () => {
    expect(goalStreak(days, 6, "2026-10-05")).toBe(2);
  });

  it("is zero when today and yesterday both miss the goal", () => {
    expect(goalStreak(days, 6, "2026-10-06")).toBe(0);
  });

  it("starts from yesterday when today is still empty", () => {
    expect(goalStreak(days, 6, "2026-10-02")).toBe(1);
  });

  it("treats missing days as zero and crosses month boundaries", () => {
    const sparse: ActivityDay[] = [
      { date: "2026-09-30", count: 6 },
      { date: "2026-10-01", count: 6 },
    ];
    expect(goalStreak(sparse, 6, "2026-10-01")).toBe(2);
    expect(goalStreak(sparse, 6, "2026-10-03")).toBe(0);
  });
});

describe("mock learning path", () => {
  it("has nine stages, numbered 0-8, in all three statuses", () => {
    expect(pathStages.map((s) => s.number)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(new Set(pathStages.map((s) => s.status))).toEqual(
      new Set(["mastered", "active", "locked"]),
    );
  });

  it("matches the progress calendar for today", () => {
    expect(TODAY).toBe("2026-10-07");
    expect(todayCount).toBe(6);
    expect(goalStreak(pathActivity, dailyGoal, TODAY)).toBe(2);
  });

  it("continues with the unfinished worksheet", () => {
    expect(nextWorksheet?.status).toBe("in_progress");
  });
});
