import type { Stroke } from "./types";

/** One undoable step. Each keeps what it needs to be reversed and re-applied. */
type Action =
  | { type: "add"; stroke: Stroke }
  | { type: "erase"; removed: { stroke: Stroke; index: number }[] }
  | { type: "clear"; removed: Stroke[] };

/**
 * The strokes on a canvas plus the undo and redo history. No drawing and no DOM, so the history
 * rules can be tested on their own.
 *
 * Every change is one step: a stroke added, a set of strokes erased in one sweep, or the whole page
 * cleared. A new change after an undo discards what could have been redone.
 */
export class InkDocument {
  private strokes: Stroke[] = [];
  private undoStack: Action[] = [];
  private redoStack: Action[] = [];

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get strokeCount(): number {
    return this.strokes.length;
  }

  /** A copy of the strokes, in drawing order. */
  getStrokes(): Stroke[] {
    return [...this.strokes];
  }

  add(stroke: Stroke): void {
    this.strokes.push(stroke);
    this.record({ type: "add", stroke });
  }

  /** Removes the strokes with these ids as a single step; ids that are not on the page are ignored. */
  erase(ids: Iterable<string>): void {
    const wanted = new Set(ids);
    const removed: { stroke: Stroke; index: number }[] = [];
    this.strokes.forEach((stroke, index) => {
      if (wanted.has(stroke.id)) removed.push({ stroke, index });
    });
    if (removed.length === 0) return;
    this.strokes = this.strokes.filter((stroke) => !wanted.has(stroke.id));
    this.record({ type: "erase", removed });
  }

  /** Removes every stroke as a single step, so it can be undone. Does nothing on an empty page. */
  clear(): void {
    if (this.strokes.length === 0) return;
    const removed = this.strokes;
    this.strokes = [];
    this.record({ type: "clear", removed });
  }

  undo(): boolean {
    const action = this.undoStack.pop();
    if (!action) return false;
    this.reverse(action);
    this.redoStack.push(action);
    return true;
  }

  redo(): boolean {
    const action = this.redoStack.pop();
    if (!action) return false;
    this.apply(action);
    this.undoStack.push(action);
    return true;
  }

  private record(action: Action): void {
    this.undoStack.push(action);
    this.redoStack = [];
  }

  private apply(action: Action): void {
    switch (action.type) {
      case "add":
        this.strokes.push(action.stroke);
        break;
      case "erase": {
        const gone = new Set(action.removed.map((entry) => entry.stroke.id));
        this.strokes = this.strokes.filter((stroke) => !gone.has(stroke.id));
        break;
      }
      case "clear":
        this.strokes = [];
        break;
    }
  }

  private reverse(action: Action): void {
    switch (action.type) {
      case "add":
        this.strokes = this.strokes.filter((stroke) => stroke.id !== action.stroke.id);
        break;
      case "erase":
        // Put each stroke back at its old position; lowest index first keeps later ones valid.
        for (const { stroke, index } of [...action.removed].sort((a, b) => a.index - b.index)) {
          this.strokes.splice(index, 0, stroke);
        }
        break;
      case "clear":
        this.strokes = [...action.removed];
        break;
    }
  }
}
