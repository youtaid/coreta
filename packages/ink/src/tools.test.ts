import { describe, expect, it } from "vitest";

import { distanceToSegment, PalmGuard, strokesErasedAlong, strokeTouchesCircle } from "./tools";
import type { Stroke } from "./types";

const line = (id: string, ...coords: [number, number][]): Stroke => ({
  id,
  color: "currentColor",
  size: 4,
  points: coords.map(([x, y]) => ({ x, y, pressure: 0.5 })),
  simulatePressure: false,
});

describe("distanceToSegment", () => {
  it.each([
    [{ x: 5, y: 3 }, 3], // beside the middle
    [{ x: -4, y: 3 }, 5], // beyond the start: distance to the endpoint
    [{ x: 14, y: -3 }, 5], // beyond the end
    [{ x: 5, y: 0 }, 0], // on the segment
  ])("point %j is %d away from (0,0)–(10,0)", (point, expected) => {
    expect(distanceToSegment(point, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(expected, 10);
  });

  it("handles a zero-length segment", () => {
    expect(distanceToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(5);
  });
});

describe("strokeTouchesCircle", () => {
  const stroke = line("s", [0, 0], [100, 0]); // size 4, so 2 px either side

  it("touches within the eraser radius plus half the stroke width", () => {
    expect(strokeTouchesCircle(stroke, { x: 50, y: 10 }, 8)).toBe(true); // 10 <= 8 + 2
    expect(strokeTouchesCircle(stroke, { x: 50, y: 10.5 }, 8)).toBe(false);
  });

  it("treats a single point (a dot) as a circle", () => {
    const dot = line("d", [20, 20]);
    expect(strokeTouchesCircle(dot, { x: 20, y: 30 }, 8)).toBe(true);
    expect(strokeTouchesCircle(dot, { x: 20, y: 40 }, 8)).toBe(false);
  });

  it("never touches a stroke with no points", () => {
    expect(strokeTouchesCircle(line("e"), { x: 0, y: 0 }, 99)).toBe(false);
  });
});

describe("strokesErasedAlong", () => {
  const strokes = [
    line("top", [0, 10], [200, 10]),
    line("middle", [0, 50], [200, 50]),
    line("bottom", [0, 90], [200, 90]),
  ];

  it("erases a stroke the eraser sits on", () => {
    expect(strokesErasedAlong(strokes, { x: 100, y: 50 }, { x: 100, y: 50 }, 10)).toEqual([
      "middle",
    ]);
  });

  it("does not skip a thin stroke crossed by a fast sweep", () => {
    // One jump from y=0 to y=100 passes over all three lines.
    expect(strokesErasedAlong(strokes, { x: 100, y: 0 }, { x: 100, y: 100 }, 6)).toEqual([
      "top",
      "middle",
      "bottom",
    ]);
  });

  it("erases nothing when the eraser stays clear", () => {
    expect(strokesErasedAlong(strokes, { x: 100, y: 25 }, { x: 100, y: 35 }, 6)).toEqual([]);
  });

  it("returns ids in drawing order", () => {
    expect(strokesErasedAlong(strokes, { x: 5, y: 95 }, { x: 5, y: 5 }, 6)).toEqual([
      "top",
      "middle",
      "bottom",
    ]);
  });
});

describe("PalmGuard", () => {
  it("ignores touch while a pen is down", () => {
    const guard = new PalmGuard(500);
    guard.penActive(1, 1000);
    expect(guard.shouldIgnore("touch", 1000)).toBe(true);
    expect(guard.shouldIgnore("touch", 99_000)).toBe(true); // still down, however long
  });

  it("keeps ignoring touch for the grace period after the pen lifts, then allows it", () => {
    const guard = new PalmGuard(500);
    guard.penActive(1, 1000);
    guard.penReleased(1, 2000);
    expect(guard.shouldIgnore("touch", 2000)).toBe(true);
    expect(guard.shouldIgnore("touch", 2499)).toBe(true);
    expect(guard.shouldIgnore("touch", 2500)).toBe(false);
  });

  it("allows touch when no pen has been used", () => {
    expect(new PalmGuard().shouldIgnore("touch", 0)).toBe(false);
  });

  it("never ignores the pen or the mouse", () => {
    const guard = new PalmGuard(500);
    guard.penActive(1, 1000);
    expect(guard.shouldIgnore("pen", 1000)).toBe(false);
    expect(guard.shouldIgnore("mouse", 1000)).toBe(false);
  });

  it("stays active while any one of several pens is down", () => {
    const guard = new PalmGuard(0);
    guard.penActive(1, 0);
    guard.penActive(2, 0);
    guard.penReleased(1, 10);
    expect(guard.shouldIgnore("touch", 1_000)).toBe(true);
    guard.penReleased(2, 20);
    expect(guard.shouldIgnore("touch", 1_000)).toBe(false);
  });
});
