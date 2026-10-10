import { describe, expect, it } from "vitest";

import { clampPosition, moveByKey } from "./floating-window";
import { countWords, resolveLayout } from "./workspace-fit";

const media = { id: "m", kind: "diagram", altText: "diagram" } as const;
const stimulus = { id: "s", kind: "reading", title: "t", bodyText: "satu dua tiga" } as const;

describe("countWords", () => {
  it.each([
    ["", 0],
    ["   ", 0],
    ["satu", 1],
    ["satu  dua\n\ntiga", 3],
  ])("%j → %d", (text, expected) => {
    expect(countWords(text)).toBe(expected);
  });
});

describe("resolveLayout", () => {
  it("keeps the declared mode when nothing overflows", () => {
    expect(resolveLayout({ layoutMode: "standar" })).toEqual({
      mode: "standar",
      reason: "declared",
      mediaPlacement: "none",
    });
  });

  it("escalates standar → media when the question carries media", () => {
    expect(resolveLayout({ layoutMode: "standar", media })).toEqual({
      mode: "media",
      reason: "has_media",
      mediaPlacement: "inline",
    });
  });

  it("escalates to bacaan when there is a reading stimulus, whatever was declared", () => {
    expect(resolveLayout({ layoutMode: "standar", stimulus }).mode).toBe("bacaan");
    expect(resolveLayout({ layoutMode: "media", stimulus }).mode).toBe("bacaan");
  });

  it("never downgrades a declared mode", () => {
    expect(resolveLayout({ layoutMode: "bacaan" })).toEqual({
      mode: "bacaan",
      reason: "declared",
      mediaPlacement: "none",
    });
    expect(resolveLayout({ layoutMode: "media" }).mode).toBe("media");
  });

  it("floats media that comes with a reading passage", () => {
    expect(resolveLayout({ layoutMode: "bacaan", stimulus, media })).toEqual({
      mode: "bacaan",
      reason: "declared",
      mediaPlacement: "floating",
    });
  });
});

describe("clampPosition", () => {
  const container = { width: 400, height: 300 };
  const win = { width: 120, height: 80 };

  it("leaves a position that already fits", () => {
    expect(clampPosition({ x: 50, y: 60 }, win, container)).toEqual({ x: 50, y: 60 });
  });

  it("pulls a window back from every edge, keeping the margin", () => {
    expect(clampPosition({ x: -40, y: -40 }, win, container)).toEqual({ x: 8, y: 8 });
    expect(clampPosition({ x: 999, y: 999 }, win, container)).toEqual({ x: 272, y: 212 });
  });

  it("pins a window larger than its container to the top-left margin", () => {
    expect(clampPosition({ x: 100, y: 100 }, { width: 500, height: 400 }, container)).toEqual({
      x: 8,
      y: 8,
    });
  });
});

describe("moveByKey", () => {
  const container = { width: 400, height: 300 };
  const win = { width: 120, height: 80 };

  it("moves one step per arrow key", () => {
    expect(moveByKey("ArrowLeft", { x: 100, y: 100 }, win, container)).toEqual({ x: 84, y: 100 });
    expect(moveByKey("ArrowDown", { x: 100, y: 100 }, win, container)).toEqual({ x: 100, y: 116 });
  });

  it("stops at the container edge", () => {
    expect(moveByKey("ArrowRight", { x: 272, y: 100 }, win, container)).toEqual({ x: 272, y: 100 });
  });

  it("ignores other keys", () => {
    expect(moveByKey("Enter", { x: 100, y: 100 }, win, container)).toBeUndefined();
  });
});
