import { describe, expect, it } from "vitest";

import {
  countByStatus,
  describeRemaining,
  formatCountdown,
  slaLevel,
  sortReviewQueue,
} from "./sla";

const MIN = 60_000;
const HOUR = 60 * MIN;

describe("slaLevel", () => {
  it.each([
    [24 * HOUR, "ok"],
    [4 * HOUR, "ok"], // exactly four hours is not yet urgent
    [4 * HOUR - 1, "urgent"],
    [1, "urgent"],
    [0, "overdue"],
    [-5 * MIN, "overdue"],
  ] as const)("%d ms left → %s", (remaining, expected) => {
    expect(slaLevel(remaining)).toBe(expected);
  });
});

describe("formatCountdown", () => {
  it.each([
    [24 * HOUR, "24:00:00"],
    [HOUR + 23 * MIN + 45_000, "01:23:45"],
    [59_999, "00:00:59"],
    [0, "00:00:00"],
    [-(2 * HOUR + 5 * MIN), "02:05:00"],
  ])("%d ms → %s", (remaining, expected) => {
    expect(formatCountdown(remaining)).toBe(expected);
  });
});

describe("describeRemaining", () => {
  it("speaks hours and minutes, and says when the deadline has passed", () => {
    expect(describeRemaining(3 * HOUR + 12 * MIN)).toBe("3 jam 12 menit tersisa");
    expect(describeRemaining(45 * MIN)).toBe("45 menit tersisa");
    expect(describeRemaining(-(HOUR + 5 * MIN))).toBe("Terlambat 1 jam 5 menit");
  });
});

describe("sortReviewQueue", () => {
  const reports = [
    { id: "a", status: "valid", dueInMinutes: 5 },
    { id: "b", status: "open", dueInMinutes: 600 },
    { id: "c", status: "open", dueInMinutes: -30 },
    { id: "d", status: "item_flagged", dueInMinutes: 1 },
    { id: "e", status: "open", dueInMinutes: 90 },
  ] as const;

  it("puts open reports first by soonest deadline, overdue ones leading", () => {
    expect(sortReviewQueue(reports).map((r) => r.id)).toEqual(["c", "e", "b", "a", "d"]);
  });

  it("does not modify its input", () => {
    const copy = [...reports];
    sortReviewQueue(copy);
    expect(copy).toEqual([...reports]);
  });
});

describe("countByStatus", () => {
  it("counts every status, including those with none", () => {
    expect(countByStatus([{ status: "open" }, { status: "open" }, { status: "revised" }])).toEqual({
      open: 2,
      valid: 0,
      revised: 1,
      item_flagged: 0,
    });
  });
});
