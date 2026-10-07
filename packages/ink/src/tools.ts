import type { InkPoint, Stroke } from "./types";

// --- Eraser -----------------------------------------------------------------------------------

interface Vec {
  x: number;
  y: number;
}

/** Shortest distance from a point to the segment a–b. */
export function distanceToSegment(p: Vec, a: Vec, b: Vec): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Whether a circle at `center` touches the stroke (its line plus half its width). */
export function strokeTouchesCircle(stroke: Stroke, center: Vec, radius: number): boolean {
  const reach = radius + stroke.size / 2;
  const { points } = stroke;
  if (points.length === 0) return false;
  if (points.length === 1) {
    const only = points[0] as InkPoint;
    return Math.hypot(center.x - only.x, center.y - only.y) <= reach;
  }
  for (let i = 1; i < points.length; i += 1) {
    if (distanceToSegment(center, points[i - 1] as InkPoint, points[i] as InkPoint) <= reach) {
      return true;
    }
  }
  return false;
}

/**
 * Ids of the strokes an eraser touches while moving from `from` to `to`. The path is sampled finely
 * enough that a fast sweep cannot skip over a thin stroke.
 */
export function strokesErasedAlong(
  strokes: readonly Stroke[],
  from: Vec,
  to: Vec,
  radius: number,
): string[] {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius / 2)));
  const hit = new Set<string>();
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const center = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    for (const stroke of strokes) {
      if (!hit.has(stroke.id) && strokeTouchesCircle(stroke, center, radius)) hit.add(stroke.id);
    }
  }
  return strokes.filter((stroke) => hit.has(stroke.id)).map((stroke) => stroke.id);
}

// --- Palm rejection ---------------------------------------------------------------------------

export type PointerKind = "pen" | "touch" | "mouse";

/** After a pen lifts, a resting palm often lands a moment later; touches are still ignored then. */
export const DEFAULT_PALM_GRACE_MS = 500;

/**
 * Decides whether a touch should be ignored because a pen is in use. While a pen is down, or has
 * just been, touches are palms and are ignored. Mouse and pen input is never ignored. Time is
 * passed in, so the rule needs no clock.
 */
export class PalmGuard {
  private readonly activePens = new Set<number>();
  private lastPenActivity = Number.NEGATIVE_INFINITY;

  constructor(private readonly graceMs: number = DEFAULT_PALM_GRACE_MS) {}

  /** The pen touched down or hovers nearby. */
  penActive(pointerId: number, now: number): void {
    this.activePens.add(pointerId);
    this.lastPenActivity = now;
  }

  /** The pen lifted or was cancelled. */
  penReleased(pointerId: number, now: number): void {
    this.activePens.delete(pointerId);
    this.lastPenActivity = now;
  }

  shouldIgnore(kind: PointerKind, now: number): boolean {
    if (kind !== "touch") return false;
    if (this.activePens.size > 0) return true;
    return now - this.lastPenActivity < this.graceMs;
  }
}
