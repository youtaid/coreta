import { describe, expect, it } from "vitest";

import {
  filterItems,
  itemHealth,
  validateItem,
  worksheetBlockers,
  worksheetItemCount,
} from "./admin-content";
import { itemToWorkspaceQuestion, previewScale, previewSizes } from "./item-preview";
import { adminItems, adminUsers, adminWorksheets, getAdminItem } from "./mock/content";

const item = (id: string) => getAdminItem(id)!;

describe("itemHealth", () => {
  it.each([
    [{ attempts: 340, correctRate: 0.95, reportCount: 0 }, ["too_easy"]],
    [{ attempts: 54, correctRate: 0.2, reportCount: 1 }, ["too_hard"]],
    [{ attempts: 212, correctRate: 0.48, reportCount: 4 }, ["often_reported"]],
    [{ attempts: 100, correctRate: 0.5, reportCount: 2 }, []],
    // Too few attempts to judge difficulty, but reports are counted regardless.
    [{ attempts: 10, correctRate: 1, reportCount: 3 }, ["often_reported"]],
    [{ attempts: 29, correctRate: 0.99, reportCount: 0 }, []],
  ] as const)("%j → %j", (stats, expected) => {
    expect(itemHealth(stats)).toEqual(expected);
  });
});

describe("validateItem", () => {
  it("accepts a complete item", () => {
    expect(validateItem(item("item-math-01"))).toEqual([]);
    expect(validateItem(item("item-isian-01"))).toEqual([]);
  });

  it("reports distractors that have no hint", () => {
    const issues = validateItem(item("item-long-01"));
    expect(issues[0]?.rule).toBe("hints");
    expect(issues[0]?.message).toContain("D, E");
    // The draft also declares layout "standar" although it carries a reading passage.
    expect(issues.map((i) => i.rule)).toEqual(["hints", "layout_mode"]);
  });

  it("requires a key, an explanation, and a stem", () => {
    const base = item("item-math-01");
    const rules = validateItem({ ...base, stem: " ", answerKey: [], explanation: "" }).map(
      (i) => i.rule,
    );
    expect(rules).toEqual(expect.arrayContaining(["stem", "answer_key", "explanation"]));
  });

  it("allows only one key for single-choice items and rejects keys that point nowhere", () => {
    const base = item("item-math-01");
    expect(validateItem({ ...base, answerKey: ["opt-1-a", "opt-1-b"] })[0]?.message).toContain(
      "satu kunci",
    );
    expect(validateItem({ ...base, answerKey: ["ghost"] }).map((i) => i.rule)).toContain(
      "answer_key",
    );
  });

  it("requires alt text on media", () => {
    const base = item("item-math-02");
    const media = { ...base.media!, altText: "" };
    expect(validateItem({ ...base, media }).map((i) => i.rule)).toEqual(["alt_text"]);
  });

  it("flags a layout mode that cannot hold the content", () => {
    const base = item("item-math-02"); // has media
    const issues = validateItem({ ...base, layoutMode: "standar" });
    expect(issues.map((i) => i.rule)).toEqual(["layout_mode"]);
    expect(issues[0]?.message).toContain('"media"');
  });
});

describe("filterItems", () => {
  const all = { query: "", status: "all", tier: "all", unhealthyOnly: false } as const;

  it("returns everything with no filters", () => {
    expect(filterItems(adminItems, all)).toHaveLength(adminItems.length);
  });

  it("filters by status, tier, and health", () => {
    expect(filterItems(adminItems, { ...all, status: "published" })).toHaveLength(3);
    expect(filterItems(adminItems, { ...all, tier: "dasar" }).map((i) => i.id)).toEqual([
      "item-isian-01",
    ]);
    expect(
      filterItems(adminItems, { ...all, unhealthyOnly: true })
        .map((i) => i.id)
        .sort(),
    ).toEqual(["item-bs-01", "item-isian-01", "item-math-01", "item-pgk-01"]);
  });

  it("searches code, competency name, and competency code, ignoring case", () => {
    expect(filterItems(adminItems, { ...all, query: "invers" }).map((i) => i.id)).toEqual([
      "item-pgk-01",
    ]);
    expect(filterItems(adminItems, { ...all, query: "mat-sma-alj" })).toHaveLength(2);
    expect(filterItems(adminItems, { ...all, query: "m6.1" })).toHaveLength(1);
  });
});

describe("worksheets", () => {
  it("blocks release until slots are full and every item is published", () => {
    const [w41, w42, w40] = adminWorksheets;
    expect(worksheetBlockers(w41!)).toEqual(["2 butir belum terbit."]);
    expect(worksheetBlockers(w42!)).toEqual(["Slot ulang berisi 1 soal, seharusnya 2."]);
    expect(worksheetBlockers(w40!)).toEqual([]);
  });

  it("counts eight items in a full worksheet", () => {
    expect(worksheetItemCount(adminWorksheets[2]!)).toBe(8);
  });
});

describe("item preview", () => {
  it("offers the three screens from the phase 10 definition of done", () => {
    expect(previewSizes.map((s) => [s.width, s.height])).toEqual([
      [1180, 820],
      [820, 1180],
      [390, 844],
    ]);
  });

  it("scales a frame down to fit but never up", () => {
    expect(previewScale(590, 1180)).toBe(0.5);
    expect(previewScale(2000, 1180)).toBe(1);
    expect(previewScale(0, 1180)).toBe(1);
  });

  it("maps an item to a standalone workspace question without leaking hints", () => {
    const question = itemToWorkspaceQuestion(item("item-math-01"));
    expect(question.number).toBe(1);
    expect(question.totalQuestions).toBe(1);
    expect(question.options).toHaveLength(5);
    expect(JSON.stringify(question)).not.toContain("hint");
    expect(JSON.stringify(question)).not.toContain("answerKey");
  });
});

describe("mock content", () => {
  it("has unique item ids and codes", () => {
    expect(new Set(adminItems.map((i) => i.id)).size).toBe(adminItems.length);
    expect(new Set(adminItems.map((i) => i.code)).size).toBe(adminItems.length);
  });

  it("covers every status and every answer type", () => {
    expect(new Set(adminItems.map((i) => i.status))).toEqual(
      new Set(["draft", "review", "published", "retired"]),
    );
    expect(new Set(adminItems.map((i) => i.answerType))).toEqual(
      new Set(["pg", "pgk", "bs", "isian"]),
    );
  });

  it("gives every hint-report item an editor page", () => {
    expect(getAdminItem("item-math-03")).toBeDefined();
    expect(getAdminItem("item-long-01")).toBeDefined();
    expect(getAdminItem("nope")).toBeUndefined();
  });

  it("gives only parents a subscription", () => {
    for (const user of adminUsers) {
      expect(user.subscription !== undefined).toBe(user.role === "parent");
    }
  });
});
