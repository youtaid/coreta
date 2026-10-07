import { getStroke } from "perfect-freehand";

import { InkDocument } from "./document";
import { PalmGuard, strokesErasedAlong } from "./tools";
import type { InkPoint, Stroke, Tool } from "./types";

export interface InkEngineOptions {
  /** Pen color; "currentColor" (the default) follows the canvas element's text color. */
  color?: string;
  /** Pen width in CSS pixels at full pressure. */
  size?: number;
  /** Eraser radius in CSS pixels. */
  eraserRadius?: number;
  /** How long after a pen lifts touches are still treated as palms. */
  palmGraceMs?: number;
  /** Clock in milliseconds; injected so palm rejection can be tested. */
  now?: () => number;
  /** Makes stroke ids; defaults to a counter, so ids are unique per engine. */
  createId?: () => string;
}

export interface InkState {
  tool: Tool;
  canUndo: boolean;
  canRedo: boolean;
  strokeCount: number;
}

type Listener = (state: InkState) => void;

const PEN_ERASER_BUTTON = 32;

/**
 * Digital ink on a <canvas>, with no framework. It listens to Pointer Events, so pen, finger, and
 * mouse all work; draws smooth, pressure-sensitive strokes with perfect-freehand; and offers a pen,
 * a stroke eraser, undo and redo, and clear.
 *
 * Palm rejection: touches are ignored while a pen is down and for a short grace period after it
 * lifts. Only one pointer draws at a time; a second finger is ignored.
 *
 * Coordinates are CSS pixels. The canvas should have `touch-action: none` (set here) and a size
 * given by CSS; call `resize()` when that size changes.
 */
export class InkEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly document = new InkDocument();
  private readonly palm: PalmGuard;
  private readonly listeners = new Set<Listener>();
  private readonly color: string;
  private readonly size: number;
  private readonly eraserRadius: number;
  private readonly now: () => number;
  private readonly createId: () => string;

  private tool: Tool = "pen";
  private activePointerId: number | null = null;
  private activeKind: "pen" | "touch" | "mouse" = "mouse";
  private gestureTool: Tool = "pen";
  private current: Stroke | null = null;
  private lastErasePoint: { x: number; y: number } | null = null;
  /** Strokes swept by the eraser in the current gesture; removed from the page when it ends. */
  private pendingErase = new Set<string>();
  private idCounter = 0;
  private cssWidth = 0;
  private cssHeight = 0;
  private destroyed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: InkEngineOptions = {},
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Kanvas tidak mendukung konteks 2D.");
    this.ctx = ctx;
    this.color = options.color ?? "currentColor";
    this.size = options.size ?? 4;
    this.eraserRadius = options.eraserRadius ?? 14;
    this.now = options.now ?? (() => Date.now());
    this.createId = options.createId ?? (() => `stroke-${(this.idCounter += 1)}`);
    this.palm = new PalmGuard(options.palmGraceMs);

    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerup", this.handlePointerEnd);
    canvas.addEventListener("pointercancel", this.handlePointerEnd);
    this.resize();
  }

  // --- Public API -----------------------------------------------------------------------------

  getTool(): Tool {
    return this.tool;
  }

  setTool(tool: Tool): void {
    if (tool === this.tool) return;
    this.tool = tool;
    this.emit();
  }

  getState(): InkState {
    return {
      tool: this.tool,
      canUndo: this.document.canUndo,
      canRedo: this.document.canRedo,
      strokeCount: this.document.strokeCount,
    };
  }

  /** The strokes on the page, in drawing order. */
  getStrokes(): Stroke[] {
    return this.document.getStrokes();
  }

  /** Calls `listener` whenever the tool, the strokes, or the undo/redo availability change. */
  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  undo(): void {
    this.cancelGesture();
    if (this.document.undo()) this.changed();
  }

  redo(): void {
    this.cancelGesture();
    if (this.document.redo()) this.changed();
  }

  /** Clears the page. This is one undoable step. */
  clear(): void {
    this.cancelGesture();
    this.document.clear();
    this.changed();
  }

  /** Matches the drawing buffer to the canvas's CSS size and screen density, then redraws. */
  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const density = globalThis.devicePixelRatio || 1;
    this.cssWidth = rect.width;
    this.cssHeight = rect.height;
    this.canvas.width = Math.max(1, Math.round(rect.width * density));
    this.canvas.height = Math.max(1, Math.round(rect.height * density));
    this.ctx.setTransform(density, 0, 0, density, 0, 0);
    this.redraw();
  }

  /** Draws everything again; call after the canvas's text color changes (a theme switch). */
  redraw(): void {
    this.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);
    for (const stroke of this.document.getStrokes()) {
      if (!this.pendingErase.has(stroke.id)) this.drawStroke(stroke);
    }
    if (this.current) this.drawStroke(this.current);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerEnd);
    this.canvas.removeEventListener("pointercancel", this.handlePointerEnd);
    this.listeners.clear();
  }

  // --- Pointer handling -----------------------------------------------------------------------

  private readonly handlePointerDown = (event: PointerEvent): void => {
    const now = this.now();
    const kind = event.pointerType as "pen" | "touch" | "mouse";
    if (this.palm.shouldIgnore(kind, now)) return;
    if (kind === "pen") this.palm.penActive(event.pointerId, now);
    if (this.activePointerId !== null) {
      // One pointer draws at a time, but a pen takes over from a touch: that touch was a palm.
      if (kind === "pen" && this.activeKind !== "pen") this.cancelGesture();
      else return;
    }
    if (kind === "mouse" && event.button !== 0) return;

    event.preventDefault();
    this.activePointerId = event.pointerId;
    this.activeKind = kind;
    this.capture(event.pointerId);

    // The pen's eraser end or barrel button erases whatever tool is selected.
    this.gestureTool = event.buttons & PEN_ERASER_BUTTON ? "eraser" : this.tool;
    const point = this.toPoint(event);

    if (this.gestureTool === "pen") {
      this.current = {
        id: this.createId(),
        color: this.color,
        size: this.size,
        points: [point],
        simulatePressure: kind !== "pen",
      };
      this.redraw();
    } else {
      this.pendingErase = new Set();
      this.lastErasePoint = { x: point.x, y: point.y };
      this.eraseTo(point);
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const now = this.now();
    // A hovering pen counts as pen activity, so a palm resting nearby is ignored.
    if (event.pointerType === "pen") this.palm.penActive(event.pointerId, now);
    if (event.pointerId !== this.activePointerId) return;

    event.preventDefault();
    const events = event.getCoalescedEvents?.() ?? [];
    for (const sample of events.length > 0 ? events : [event]) {
      const point = this.toPoint(sample);
      if (this.gestureTool === "pen") this.current?.points.push(point);
      else this.eraseTo(point);
    }
    if (this.gestureTool === "pen") this.redraw();
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    if (event.pointerType === "pen") this.palm.penReleased(event.pointerId, this.now());
    if (event.pointerId !== this.activePointerId) return;

    this.release(event.pointerId);
    this.finishGesture(event.type === "pointerup");
  };

  // --- Gestures -------------------------------------------------------------------------------

  private finishGesture(commit: boolean): void {
    if (this.gestureTool === "pen" && this.current) {
      if (commit) this.document.add(this.current);
      this.current = null;
    } else if (this.gestureTool === "eraser") {
      if (commit) this.document.erase(this.pendingErase);
      this.pendingErase = new Set();
      this.lastErasePoint = null;
    }
    this.activePointerId = null;
    this.changed();
  }

  /** Drops a gesture in progress without recording it, for undo, redo, and clear mid-stroke. */
  private cancelGesture(): void {
    if (this.activePointerId === null) return;
    this.release(this.activePointerId);
    this.finishGesture(false);
  }

  // Capture keeps events coming when a finger or pen leaves the canvas mid-stroke. The browser
  // throws if the pointer is already gone, which must not abort the stroke.
  private capture(pointerId: number): void {
    try {
      this.canvas.setPointerCapture?.(pointerId);
    } catch {
      // The pointer ended before capture; the gesture still works within the canvas.
    }
  }

  private release(pointerId: number): void {
    try {
      this.canvas.releasePointerCapture?.(pointerId);
    } catch {
      // Nothing to release.
    }
  }

  private eraseTo(point: InkPoint): void {
    const from = this.lastErasePoint ?? point;
    const remaining = this.document.getStrokes().filter((s) => !this.pendingErase.has(s.id));
    for (const id of strokesErasedAlong(remaining, from, point, this.eraserRadius)) {
      this.pendingErase.add(id);
    }
    this.lastErasePoint = { x: point.x, y: point.y };
    this.redraw();
  }

  private toPoint(event: PointerEvent): InkPoint {
    const rect = this.canvas.getBoundingClientRect();
    // Real pens report pressure; mice report 0.5 while pressed; some pens report 0 on first contact.
    const pressure = event.pressure > 0 ? event.pressure : 0.5;
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, pressure };
  }

  // --- Drawing --------------------------------------------------------------------------------

  private drawStroke(stroke: Stroke): void {
    const outline = getStroke(stroke.points, {
      size: stroke.size,
      thinning: 0.6,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: stroke.simulatePressure,
    });
    if (outline.length === 0) return;

    const ctx = this.ctx;
    ctx.beginPath();
    const [first, ...rest] = outline as [number, number][];
    ctx.moveTo(first[0], first[1]);
    // Curve through the midpoints of the outline so the edge is smooth rather than faceted.
    let previous = first;
    for (const point of rest) {
      ctx.quadraticCurveTo(
        previous[0],
        previous[1],
        (previous[0] + point[0]) / 2,
        (previous[1] + point[1]) / 2,
      );
      previous = point;
    }
    ctx.closePath();
    ctx.fillStyle = stroke.color;
    ctx.fill();
  }

  // --- Notifications --------------------------------------------------------------------------

  private changed(): void {
    this.redraw();
    this.emit();
  }

  private emit(): void {
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
  }
}
