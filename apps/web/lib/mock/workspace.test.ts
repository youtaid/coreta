import { describe, expect, it } from "vitest";

import {
  getMockWorkspaceQuestion,
  mockWorkspaceAssignment,
  mockWorkspaceQuestions,
} from "./workspace";

describe("mockWorkspaceQuestions", () => {
  it("provides exactly three mock questions matching the three DoD layout modes", () => {
    expect(mockWorkspaceQuestions).toHaveLength(3);
    const modes = mockWorkspaceQuestions.map((q) => q.layoutMode);
    expect(modes).toEqual(["standar", "media", "bacaan"]);
  });

  it("configures question 1 as standard mode with prompt and math formula", () => {
    const q1 = mockWorkspaceQuestions[0];
    expect(q1.number).toBe(1);
    expect(q1.layoutMode).toBe("standar");
    expect(q1.tier).toBe("mahir");
    expect(q1.formula).toContain("D = b^2 - 4ac");
    expect(q1.options).toHaveLength(5);
    expect(q1.media).toBeUndefined();
    expect(q1.stimulus).toBeUndefined();
  });

  it("configures question 2 as media mode with diagram and coordinates", () => {
    const q2 = mockWorkspaceQuestions[1];
    expect(q2.number).toBe(2);
    expect(q2.layoutMode).toBe("media");
    expect(q2.media).toBeDefined();
    expect(q2.media?.kind).toBe("diagram");
    expect(q2.media?.altText).toBeTruthy();
    expect(q2.options).toHaveLength(5);
  });

  it("configures question 3 as reading mode with long narrative stimulus", () => {
    const q3 = mockWorkspaceQuestions[2];
    expect(q3.number).toBe(3);
    expect(q3.layoutMode).toBe("bacaan");
    expect(q3.stimulus).toBeDefined();
    expect(q3.stimulus?.title).toBeTruthy();
    expect(q3.stimulus?.bodyText).toBeTruthy();

    // Check word count is long (> 200 words) to verify reading passage requirements
    const wordCount = q3.stimulus!.bodyText.split(/\s+/).length;
    expect(wordCount).toBeGreaterThan(200);
    expect(q3.options).toHaveLength(5);
  });

  it("provides valid five options (A through E) for all questions", () => {
    const expectedLabels = ["A", "B", "C", "D", "E"];
    for (const q of mockWorkspaceQuestions) {
      expect(q.options?.map((o) => o.label)).toEqual(expectedLabels);
      for (const opt of q.options ?? []) {
        expect(opt.id).toBeTruthy();
        expect(opt.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("resolves questions by ID and by number with getMockWorkspaceQuestion", () => {
    expect(getMockWorkspaceQuestion(1)?.id).toBe("item-math-01");
    expect(getMockWorkspaceQuestion(2)?.id).toBe("item-math-02");
    expect(getMockWorkspaceQuestion(3)?.id).toBe("item-math-03");
    expect(getMockWorkspaceQuestion("item-math-02")?.number).toBe(2);
    expect(getMockWorkspaceQuestion(999)).toBeUndefined();
  });

  it("exposes a complete mockWorkspaceAssignment", () => {
    expect(mockWorkspaceAssignment.id).toBe("demo-assignment");
    expect(mockWorkspaceAssignment.totalQuestions).toBe(3);
    expect(mockWorkspaceAssignment.questions).toHaveLength(3);
  });
});
