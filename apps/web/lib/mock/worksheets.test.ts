import { describe, expect, it } from "vitest";

import { worksheets } from "./learning";
import { countOutcomes, getWorksheetResult, groupWorksheets, worksheetHref } from "./worksheets";

describe("groupWorksheets", () => {
  it("splits into this week, spaced review, and completed", () => {
    const groups = groupWorksheets(worksheets);
    expect(groups.map((group) => group.key)).toEqual(["this_week", "spaced_review", "completed"]);
    expect(groups[0]?.items.map((item) => item.status)).toEqual(["new", "in_progress"]);
  });

  it("drops empty sections", () => {
    const completedOnly = worksheets.filter((item) => item.status === "completed");
    expect(groupWorksheets(completedOnly).map((group) => group.key)).toEqual(["completed"]);
  });
});

describe("worksheetHref", () => {
  it("sends completed worksheets to the result page and others to the workspace", () => {
    expect(worksheetHref({ id: "a", status: "completed" })).toBe("/belajar/hasil/a");
    expect(worksheetHref({ id: "a", status: "review" })).toBe("/belajar/kerjakan/a");
  });
});

describe("worksheet result", () => {
  it("has a result for every completed worksheet with a consistent score", () => {
    for (const item of worksheets.filter((w) => w.status === "completed")) {
      const result = getWorksheetResult(item.id);
      expect(result).toBeDefined();
      expect(result?.score).toBe(item.score);
      const earned = result?.questions.reduce((sum, q) => sum + q.points, 0) ?? 0;
      expect(earned / (result?.questions.length ?? 1)).toBeCloseTo(item.score ?? 0);
    }
  });

  it("counts outcomes", () => {
    const result = getWorksheetResult("ws-mock-201");
    expect(countOutcomes(result?.questions ?? [])).toEqual({
      correct: 6,
      partial: 1,
      incorrect: 1,
    });
  });

  it("returns undefined for unknown ids and resolves the demo alias", () => {
    expect(getWorksheetResult("nope")).toBeUndefined();
    expect(getWorksheetResult("demo-assignment")?.assignmentId).toBe("ws-mock-201");
  });
});
