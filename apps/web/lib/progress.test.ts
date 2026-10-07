import { describe, expect, it } from "vitest";

import { activityLevel, countGoalDays, groupByWeek } from "./activity";
import { getMockReply, initialMessages } from "./mock/chat";
import { weeklyStats } from "./mock/learning";
import { DAILY_GOAL, dailyActivity } from "./mock/progress";

describe("activityLevel", () => {
  it.each([
    [undefined, "future"],
    [0, "none"],
    [1, "low"],
    [2, "low"],
    [3, "mid"],
    [5, "mid"],
    [6, "goal"],
    [12, "goal"],
  ] as const)("%s of 6 → %s", (count, expected) => {
    expect(activityLevel(count, 6)).toBe(expected);
  });
});

describe("groupByWeek", () => {
  const weeks = groupByWeek(dailyActivity, DAILY_GOAL);

  it("splits 35 days into five full Monday-first weeks", () => {
    expect(weeks).toHaveLength(5);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]?.[0]?.date).toBe("2026-09-07");
    expect(weeks.at(-1)?.[0]?.date).toBe("2026-10-05");
  });

  it("starts a new week on Monday even when the first week is partial", () => {
    const partial = groupByWeek(
      [{ date: "2026-10-07", count: 6 }, { date: "2026-10-08" }, { date: "2026-10-12" }],
      6,
    );
    expect(partial.map((week) => week.map((day) => day.date))).toEqual([
      ["2026-10-07", "2026-10-08"],
      ["2026-10-12"],
    ]);
  });

  it("marks days after the last record as future", () => {
    const levels = (weeks.at(-1) ?? []).map((day) => day.level);
    expect(levels).toEqual(["none", "goal", "goal", "future", "future", "future", "future"]);
  });
});

describe("mock progress matches the weekly stats", () => {
  const lastSeven = dailyActivity.filter(
    (day) => day.date >= "2026-10-01" && day.count !== undefined,
  );

  it("covers seven days with 42 items answered", () => {
    expect(lastSeven).toHaveLength(7);
    expect(lastSeven.reduce((sum, day) => sum + (day.count ?? 0), 0)).toBe(42);
    expect(weeklyStats.find((s) => s.label === "Soal dikerjakan")?.value).toBe("42");
  });

  it("reaches the goal on 5 of 7 days", () => {
    expect(countGoalDays(lastSeven, DAILY_GOAL)).toBe(5);
    expect(weeklyStats.find((s) => s.label === "Hari mencapai target")?.value).toBe("5/7");
  });
});

describe("getMockReply", () => {
  it("answers by keyword for each audience", () => {
    expect(getMockReply("siswa", "Petunjuknya kurang jelas")).toContain("Laporkan petunjuk");
    expect(getMockReply("ortu", "Kapan laporan terbit?")).toContain("tiap Senin");
  });

  it("does not leak one audience's answers to the other", () => {
    expect(getMockReply("siswa", "langganan")).not.toContain("faktur");
  });

  it("falls back to a sample reply", () => {
    expect(getMockReply("siswa", "halo")).toContain("balasan contoh");
    expect(getMockReply("ortu", "")).toContain("balasan contoh");
  });
});

describe("initialMessages", () => {
  it("opens each conversation with one assistant greeting", () => {
    for (const messages of Object.values(initialMessages)) {
      expect(messages).toHaveLength(1);
      expect(messages[0]?.role).toBe("assistant");
    }
  });
});
