import { describe, expect, it } from "vitest";

import { InkDocument } from "./document";
import type { Stroke } from "./types";

const stroke = (id: string): Stroke => ({
  id,
  color: "currentColor",
  size: 4,
  points: [{ x: 0, y: 0, pressure: 0.5 }],
  simulatePressure: false,
});

const ids = (doc: InkDocument) => doc.getStrokes().map((s) => s.id);

function withStrokes(...names: string[]): InkDocument {
  const doc = new InkDocument();
  for (const name of names) doc.add(stroke(name));
  return doc;
}

describe("InkDocument undo and redo", () => {
  it("starts empty with nothing to undo or redo", () => {
    const doc = new InkDocument();
    expect([doc.canUndo, doc.canRedo, doc.strokeCount]).toEqual([false, false, 0]);
    expect(doc.undo()).toBe(false);
    expect(doc.redo()).toBe(false);
  });

  it("undoes and redoes strokes in order", () => {
    const doc = withStrokes("a", "b", "c");
    doc.undo();
    expect(ids(doc)).toEqual(["a", "b"]);
    doc.undo();
    expect(ids(doc)).toEqual(["a"]);
    doc.redo();
    expect(ids(doc)).toEqual(["a", "b"]);
    doc.redo();
    expect(ids(doc)).toEqual(["a", "b", "c"]);
    expect(doc.canRedo).toBe(false);
  });

  it("drops the redo history when a new stroke follows an undo", () => {
    const doc = withStrokes("a", "b");
    doc.undo();
    expect(doc.canRedo).toBe(true);
    doc.add(stroke("c"));
    expect(doc.canRedo).toBe(false);
    expect(ids(doc)).toEqual(["a", "c"]);
  });

  it("walks all the way back and forward again", () => {
    const doc = withStrokes("a", "b", "c");
    while (doc.undo());
    expect(ids(doc)).toEqual([]);
    while (doc.redo());
    expect(ids(doc)).toEqual(["a", "b", "c"]);
  });
});

describe("InkDocument eraser", () => {
  it("removes the named strokes as one step", () => {
    const doc = withStrokes("a", "b", "c", "d");
    doc.erase(["b", "d"]);
    expect(ids(doc)).toEqual(["a", "c"]);
    doc.undo();
    expect(ids(doc)).toEqual(["a", "b", "c", "d"]); // one undo restores both, in place
  });

  it("restores strokes at their original positions, not at the end", () => {
    const doc = withStrokes("a", "b", "c", "d", "e");
    doc.erase(["a", "c", "e"]);
    doc.undo();
    expect(ids(doc)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("can be redone after an undo", () => {
    const doc = withStrokes("a", "b");
    doc.erase(["a"]);
    doc.undo();
    doc.redo();
    expect(ids(doc)).toEqual(["b"]);
  });

  it("ignores ids that are not on the page and records nothing when none match", () => {
    const doc = withStrokes("a");
    const before = doc.canUndo;
    doc.erase(["ghost"]);
    expect(ids(doc)).toEqual(["a"]);
    doc.undo(); // undoes the add, proving erase added no step
    expect(ids(doc)).toEqual([]);
    expect(before).toBe(true);
  });

  it("undoes an erase that came after an undone stroke correctly", () => {
    const doc = withStrokes("a", "b");
    doc.erase(["a"]);
    doc.undo();
    doc.undo(); // removes b
    expect(ids(doc)).toEqual(["a"]);
  });
});

describe("InkDocument clear", () => {
  it("clears everything in one undoable step", () => {
    const doc = withStrokes("a", "b", "c");
    doc.clear();
    expect(doc.strokeCount).toBe(0);
    doc.undo();
    expect(ids(doc)).toEqual(["a", "b", "c"]);
    doc.redo();
    expect(doc.strokeCount).toBe(0);
  });

  it("does nothing, and records nothing, on an empty page", () => {
    const doc = new InkDocument();
    doc.clear();
    expect(doc.canUndo).toBe(false);
  });
});

describe("InkDocument.getStrokes", () => {
  it("returns a copy, so callers cannot change the page", () => {
    const doc = withStrokes("a");
    doc.getStrokes().push(stroke("intruder"));
    expect(ids(doc)).toEqual(["a"]);
  });
});
