import { describe, expect, it } from "vitest";

import { InkEngine } from "./engine";
import type { InkState } from "./engine";

// The test environment has no DOM, so the canvas is a small fake that records its listeners.
type Handler = (event: unknown) => void;

interface FakeEvent {
  pointerId: number;
  pointerType: "pen" | "touch" | "mouse";
  clientX: number;
  clientY: number;
  pressure: number;
  buttons: number;
  button: number;
}

class FakeCanvas {
  width = 0;
  height = 0;
  style: Record<string, string> = {};
  private handlers = new Map<string, Handler[]>();
  readonly drawCalls: string[] = [];

  getContext() {
    const calls = this.drawCalls;
    return new Proxy({} as Record<string, unknown>, {
      get:
        (_target, name: string) =>
        (...args: unknown[]) => {
          calls.push(`${name}`);
          return args;
        },
      set: () => true,
    });
  }
  getBoundingClientRect() {
    return { left: 10, top: 20, width: 300, height: 200 };
  }
  throwOnCapture = false;
  setPointerCapture() {
    if (this.throwOnCapture) throw new Error("NotFoundError: no active pointer");
  }
  releasePointerCapture() {
    if (this.throwOnCapture) throw new Error("NotFoundError: no active pointer");
  }
  addEventListener(type: string, handler: Handler) {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), handler]);
  }
  removeEventListener(type: string, handler: Handler) {
    this.handlers.set(
      type,
      (this.handlers.get(type) ?? []).filter((h) => h !== handler),
    );
  }
  listenerCount() {
    return [...this.handlers.values()].reduce((sum, list) => sum + list.length, 0);
  }
  fire(type: string, init: Partial<FakeEvent> = {}) {
    const event = {
      type,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 10,
      clientY: 20,
      pressure: 0,
      buttons: 1,
      button: 0,
      preventDefault() {},
      ...init,
    };
    for (const handler of this.handlers.get(type) ?? []) handler(event);
  }
}

function setup(options: ConstructorParameters<typeof InkEngine>[1] = {}) {
  const canvas = new FakeCanvas();
  const clock = { now: 0 };
  const engine = new InkEngine(canvas as unknown as HTMLCanvasElement, {
    now: () => clock.now,
    ...options,
  });
  return { canvas, engine, clock };
}

/** A drag from (x1,y1) to (x2,y2) in canvas coordinates; the fake canvas sits at (10,20). */
function drag(
  canvas: FakeCanvas,
  from: [number, number],
  to: [number, number],
  init: Partial<FakeEvent> = {},
) {
  canvas.fire("pointerdown", { clientX: from[0] + 10, clientY: from[1] + 20, ...init });
  canvas.fire("pointermove", {
    clientX: (from[0] + to[0]) / 2 + 10,
    clientY: (from[1] + to[1]) / 2 + 20,
    ...init,
  });
  canvas.fire("pointermove", { clientX: to[0] + 10, clientY: to[1] + 20, ...init });
  canvas.fire("pointerup", { clientX: to[0] + 10, clientY: to[1] + 20, ...init });
}

const pen = { pointerType: "pen" as const, pressure: 0.7 };

describe("drawing", () => {
  it("records a stroke with canvas-relative points and real pen pressure", () => {
    const { canvas, engine } = setup();
    drag(canvas, [50, 60], [150, 60], pen);
    const [stroke] = engine.getStrokes();
    expect(engine.getStrokes()).toHaveLength(1);
    expect(stroke?.points[0]).toEqual({ x: 50, y: 60, pressure: 0.7 });
    expect(stroke?.points.at(-1)).toEqual({ x: 150, y: 60, pressure: 0.7 });
    expect(stroke?.simulatePressure).toBe(false);
  });

  it("simulates pressure for a mouse and gives it a usable pressure value", () => {
    const { canvas, engine } = setup();
    drag(canvas, [0, 0], [40, 40]);
    const [stroke] = engine.getStrokes();
    expect(stroke?.simulatePressure).toBe(true);
    expect(stroke?.points[0]?.pressure).toBe(0.5);
  });

  it("keeps a single tap as a dot", () => {
    const { canvas, engine } = setup();
    canvas.fire("pointerdown", pen);
    canvas.fire("pointerup", pen);
    expect(engine.getStrokes()).toHaveLength(1);
    expect(engine.getStrokes()[0]?.points).toHaveLength(1);
  });

  it("makes every stroke's id unique", () => {
    const { canvas, engine } = setup();
    drag(canvas, [0, 0], [10, 10], pen);
    drag(canvas, [0, 5], [10, 15], pen);
    const ids = engine.getStrokes().map((s) => s.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("does not draw with the right mouse button", () => {
    const { canvas, engine } = setup();
    drag(canvas, [0, 0], [40, 40], { button: 2, buttons: 2 });
    expect(engine.getStrokes()).toHaveLength(0);
  });

  it("still draws when the browser refuses pointer capture", () => {
    const { canvas, engine } = setup();
    canvas.throwOnCapture = true;
    drag(canvas, [0, 0], [40, 40], pen);
    expect(engine.getStrokes()).toHaveLength(1);
  });

  it("makes the canvas ignore the browser's touch gestures", () => {
    expect(setup().canvas.style.touchAction).toBe("none");
  });

  it("draws to the canvas as strokes change", () => {
    const { canvas } = setup();
    const before = canvas.drawCalls.length;
    drag(canvas, [0, 0], [40, 40], pen);
    expect(canvas.drawCalls.slice(before)).toContain("fill");
  });
});

describe("palm rejection", () => {
  it("ignores touch while the pen is down", () => {
    const { canvas, engine } = setup();
    canvas.fire("pointerdown", { ...pen, pointerId: 1, clientX: 60, clientY: 70 });
    drag(canvas, [100, 100], [160, 160], { pointerType: "touch", pointerId: 2 });
    canvas.fire("pointerup", { ...pen, pointerId: 1 });
    expect(engine.getStrokes()).toHaveLength(1); // only the pen's
  });

  it("ignores touch just after the pen lifts, then accepts it after the grace period", () => {
    const { canvas, engine, clock } = setup({ palmGraceMs: 500 });
    clock.now = 1000;
    drag(canvas, [0, 0], [30, 30], pen);
    clock.now = 1300;
    drag(canvas, [50, 50], [90, 90], { pointerType: "touch", pointerId: 2 });
    expect(engine.getStrokes()).toHaveLength(1);
    clock.now = 1600;
    drag(canvas, [50, 50], [90, 90], { pointerType: "touch", pointerId: 3 });
    expect(engine.getStrokes()).toHaveLength(2);
  });

  it("ignores touch while the pen only hovers nearby", () => {
    const { canvas, engine, clock } = setup({ palmGraceMs: 500 });
    clock.now = 100;
    canvas.fire("pointermove", { ...pen, pointerId: 9, buttons: 0 }); // hover
    drag(canvas, [0, 0], [40, 40], { pointerType: "touch", pointerId: 2 });
    expect(engine.getStrokes()).toHaveLength(0);
  });

  it("lets a finger draw when no pen is around", () => {
    const { canvas, engine } = setup();
    drag(canvas, [0, 0], [40, 40], { pointerType: "touch", pointerId: 2 });
    expect(engine.getStrokes()).toHaveLength(1);
    expect(engine.getStrokes()[0]?.simulatePressure).toBe(true);
  });

  it("lets the pen take over from a touch that was already drawing", () => {
    const { canvas, engine } = setup();
    canvas.fire("pointerdown", { pointerType: "touch", pointerId: 2, clientX: 40, clientY: 50 });
    canvas.fire("pointerdown", { ...pen, pointerId: 1, clientX: 100, clientY: 100 });
    canvas.fire("pointermove", { ...pen, pointerId: 1, clientX: 140, clientY: 140 });
    canvas.fire("pointerup", { ...pen, pointerId: 1 });
    canvas.fire("pointerup", { pointerType: "touch", pointerId: 2 });
    expect(engine.getStrokes()).toHaveLength(1);
    expect(engine.getStrokes()[0]?.simulatePressure).toBe(false); // the pen's stroke, not the palm's
  });

  it("ignores a second finger while the first is drawing", () => {
    const { canvas, engine } = setup();
    canvas.fire("pointerdown", { pointerType: "touch", pointerId: 2 });
    canvas.fire("pointerdown", { pointerType: "touch", pointerId: 3, clientX: 90, clientY: 90 });
    canvas.fire("pointermove", { pointerType: "touch", pointerId: 3, clientX: 120, clientY: 120 });
    canvas.fire("pointerup", { pointerType: "touch", pointerId: 3 });
    canvas.fire("pointerup", { pointerType: "touch", pointerId: 2 });
    expect(engine.getStrokes()).toHaveLength(1);
    expect(engine.getStrokes()[0]?.points).toHaveLength(1); // the second finger added nothing
  });
});

describe("eraser", () => {
  function twoLines() {
    const ctx = setup();
    drag(ctx.canvas, [20, 50], [200, 50], pen);
    drag(ctx.canvas, [20, 150], [200, 150], pen);
    return ctx;
  }

  it("removes the strokes it crosses and keeps the others", () => {
    const { canvas, engine } = twoLines();
    engine.setTool("eraser");
    drag(canvas, [100, 40], [100, 60]);
    expect(engine.getStrokes()).toHaveLength(1);
    expect(engine.getStrokes()[0]?.points[0]?.y).toBe(150);
  });

  it("erases everything crossed in one sweep as a single undo step", () => {
    const { canvas, engine } = twoLines();
    engine.setTool("eraser");
    drag(canvas, [100, 30], [100, 170]);
    expect(engine.getStrokes()).toHaveLength(0);
    engine.undo();
    expect(engine.getStrokes()).toHaveLength(2);
  });

  it("does nothing, and adds no undo step, when it touches nothing", () => {
    const { canvas, engine } = twoLines();
    engine.setTool("eraser");
    drag(canvas, [100, 90], [100, 110]);
    expect(engine.getStrokes()).toHaveLength(2);
    engine.undo(); // undoes the last drawn stroke, not a phantom erase
    expect(engine.getStrokes()).toHaveLength(1);
  });

  it("erases with the pen's eraser button even when the pen tool is selected", () => {
    const { canvas, engine } = twoLines();
    expect(engine.getTool()).toBe("pen");
    drag(canvas, [100, 40], [100, 60], { ...pen, buttons: 32 });
    expect(engine.getStrokes()).toHaveLength(1);
  });
});

describe("undo, redo, and clear", () => {
  it("undoes and redoes strokes", () => {
    const { canvas, engine } = setup();
    drag(canvas, [0, 0], [10, 10], pen);
    drag(canvas, [0, 20], [10, 30], pen);
    engine.undo();
    expect(engine.getStrokes()).toHaveLength(1);
    engine.undo();
    expect(engine.getStrokes()).toHaveLength(0);
    engine.redo();
    engine.redo();
    expect(engine.getStrokes()).toHaveLength(2);
  });

  it("clears the page as one step that can be undone", () => {
    const { canvas, engine } = setup();
    drag(canvas, [0, 0], [10, 10], pen);
    drag(canvas, [0, 20], [10, 30], pen);
    engine.clear();
    expect(engine.getStrokes()).toHaveLength(0);
    engine.undo();
    expect(engine.getStrokes()).toHaveLength(2);
  });

  it("drops a stroke in progress when undo is pressed mid-gesture", () => {
    const { canvas, engine } = setup();
    drag(canvas, [0, 0], [10, 10], pen);
    canvas.fire("pointerdown", { ...pen, clientX: 80, clientY: 80 });
    canvas.fire("pointermove", { ...pen, clientX: 90, clientY: 90 });
    engine.undo();
    canvas.fire("pointerup", { ...pen });
    expect(engine.getStrokes()).toHaveLength(0); // the first stroke is undone, the half-drawn one never saved
  });

  it("does not save a stroke that the browser cancelled", () => {
    const { canvas, engine } = setup();
    canvas.fire("pointerdown", pen);
    canvas.fire("pointermove", { ...pen, clientX: 50, clientY: 50 });
    canvas.fire("pointercancel", pen);
    expect(engine.getStrokes()).toHaveLength(0);
  });

  it("reports what the toolbar needs after every change", () => {
    const { canvas, engine } = setup();
    const seen: InkState[] = [];
    engine.onChange((state) => seen.push(state));
    expect(engine.getState()).toEqual({
      tool: "pen",
      canUndo: false,
      canRedo: false,
      strokeCount: 0,
    });
    drag(canvas, [0, 0], [10, 10], pen);
    expect(seen.at(-1)).toMatchObject({ canUndo: true, canRedo: false, strokeCount: 1 });
    engine.undo();
    expect(seen.at(-1)).toMatchObject({ canUndo: false, canRedo: true, strokeCount: 0 });
    engine.setTool("eraser");
    expect(seen.at(-1)?.tool).toBe("eraser");
  });

  it("stops notifying a listener once it unsubscribes", () => {
    const { canvas, engine } = setup();
    let calls = 0;
    const off = engine.onChange(() => (calls += 1));
    off();
    drag(canvas, [0, 0], [10, 10], pen);
    expect(calls).toBe(0);
  });
});

describe("sizing and cleanup", () => {
  it("sizes the drawing buffer from the canvas's CSS size", () => {
    const { canvas } = setup();
    expect([canvas.width, canvas.height]).toEqual([300, 200]);
  });

  it("removes its listeners when destroyed, so nothing draws afterwards", () => {
    const { canvas, engine } = setup();
    expect(canvas.listenerCount()).toBe(4);
    engine.destroy();
    expect(canvas.listenerCount()).toBe(0);
    drag(canvas, [0, 0], [10, 10], pen);
    expect(engine.getStrokes()).toHaveLength(0);
  });
});
