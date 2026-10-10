import { describe, expect, it } from "vitest";

import { createEmptyDocument, deserialize, serialize } from "./format";
import {
  bringToFront,
  fitRect,
  fromDocumentLayers,
  MIN_LAYER_SIZE,
  moveLayer,
  type PasteLayer,
  placeLayer,
  resizeLayer,
  scaleLayer,
  toDocumentLayers,
} from "./layers";

const canvas = { w: 800, h: 600 };

const layer = (changes: Partial<PasteLayer> = {}): PasteLayer => ({
  id: "l1",
  mediaId: "media-table-1",
  x: 100,
  y: 100,
  w: 200,
  h: 100,
  ...changes,
});

const inside = (rect: { x: number; y: number; w: number; h: number }, size = canvas) =>
  rect.x >= -1e-9 &&
  rect.y >= -1e-9 &&
  rect.x + rect.w <= size.w + 1e-9 &&
  rect.y + rect.h <= size.h + 1e-9;

describe("placeLayer", () => {
  it("centres a new layer, keeps its shape, and covers at most 60% of the canvas", () => {
    const rect = placeLayer(2, canvas);
    expect(rect.w / rect.h).toBeCloseTo(2, 10);
    expect(rect.w).toBeLessThanOrEqual(800 * 0.6 + 1e-9);
    expect(rect.h).toBeLessThanOrEqual(600 * 0.6 + 1e-9);
    expect(rect.x + rect.w / 2).toBeCloseTo(400, 6);
    expect(rect.y + rect.h / 2).toBeCloseTo(300, 6);
  });

  it("is limited by the height for a tall shape", () => {
    const rect = placeLayer(0.5, canvas);
    expect(rect.h).toBeCloseTo(360, 6);
    expect(rect.w).toBeCloseTo(180, 6);
  });

  it("offsets each further layer so copies do not hide each other", () => {
    const first = placeLayer(2, canvas, 0);
    const second = placeLayer(2, canvas, 1);
    expect(second.x - first.x).toBe(24);
    expect(second.y - first.y).toBe(24);
  });

  it("wraps the offset and always stays inside the canvas", () => {
    for (let index = 0; index < 20; index += 1) {
      expect(inside(placeLayer(1.6, canvas, index))).toBe(true);
    }
    expect(placeLayer(2, canvas, 5)).toEqual(placeLayer(2, canvas, 0));
  });

  it("never makes a layer smaller than the minimum on its shorter side", () => {
    const rect = placeLayer(2, { w: 60, h: 60 });
    expect(Math.min(rect.w, rect.h)).toBeGreaterThanOrEqual(30 - 1e-9); // 60 px canvas: fitted back inside
    expect(inside(rect, { w: 60, h: 60 })).toBe(true);
  });

  it("falls back to a square for a nonsense aspect", () => {
    const rect = placeLayer(0, canvas);
    expect(rect.w).toBeCloseTo(rect.h, 10);
    expect(placeLayer(Number.NaN, canvas).w).toBeCloseTo(placeLayer(1, canvas).w, 10);
  });
});

describe("moveLayer", () => {
  it("moves by the drag distance", () => {
    expect(moveLayer(layer(), 30, -20, canvas)).toMatchObject({ x: 130, y: 80, w: 200, h: 100 });
  });

  it("stops at every edge instead of leaving the canvas", () => {
    expect(moveLayer(layer(), -500, 0, canvas).x).toBe(0);
    expect(moveLayer(layer(), 0, -500, canvas).y).toBe(0);
    expect(moveLayer(layer(), 9999, 0, canvas).x).toBe(600); // 800 - 200
    expect(moveLayer(layer(), 0, 9999, canvas).y).toBe(500); // 600 - 100
  });

  it("keeps the size and identity, and does not change its input", () => {
    const original = layer();
    const moved = moveLayer(original, 10, 10, canvas);
    expect([moved.id, moved.mediaId, moved.w, moved.h]).toEqual(["l1", "media-table-1", 200, 100]);
    expect(original.x).toBe(100);
  });
});

describe("resizeLayer", () => {
  it("grows from the south-east corner with the north-west corner fixed", () => {
    const grown = resizeLayer(layer(), "se", 100, canvas);
    expect(grown).toMatchObject({ x: 100, y: 100, w: 300, h: 150 });
  });

  it("grows from the north-west corner with the south-east corner fixed", () => {
    const grown = resizeLayer(layer(), "nw", -100, canvas);
    expect(grown.w).toBe(300);
    expect(grown.h).toBe(150);
    expect(grown.x + grown.w).toBe(300); // right edge unchanged
    expect(grown.y + grown.h).toBe(200); // bottom edge unchanged
  });

  it("works from the other two corners", () => {
    const ne = resizeLayer(layer(), "ne", 50, canvas);
    expect([ne.x, ne.y + ne.h, ne.w]).toEqual([100, 200, 250]);
    const sw = resizeLayer(layer(), "sw", -50, canvas);
    expect([sw.x + sw.w, sw.y, sw.w]).toEqual([300, 100, 250]);
  });

  it("always keeps its shape", () => {
    for (const corner of ["nw", "ne", "sw", "se"] as const) {
      const out = resizeLayer(layer(), corner, 37, canvas);
      expect(out.w / out.h).toBeCloseTo(2, 10);
    }
  });

  it("shrinks no further than the minimum on the shorter side", () => {
    const tiny = resizeLayer(layer(), "se", -9999, canvas);
    expect(Math.min(tiny.w, tiny.h)).toBeCloseTo(MIN_LAYER_SIZE, 10);
    expect(tiny.w / tiny.h).toBeCloseTo(2, 10);
    expect(resizeLayer(layer({ w: 100, h: 200 }), "se", -9999, canvas).w).toBeCloseTo(
      MIN_LAYER_SIZE,
      10,
    );
  });

  it("grows no further than the room left on the canvas", () => {
    const huge = resizeLayer(layer(), "se", 9999, canvas);
    expect(inside(huge)).toBe(true);
    // The height runs out first: 500 px of room below y=100 allows a width of 1000, the width
    // limit is 700, so the width is the limit here.
    expect(huge.w).toBeCloseTo(700, 6);
    const tall = resizeLayer(layer({ y: 400 }), "se", 9999, canvas); // only 200 px below
    expect(tall.h).toBeCloseTo(200, 6);
    expect(inside(tall)).toBe(true);
  });

  it("stays inside the canvas from every corner and every drag", () => {
    for (const corner of ["nw", "ne", "sw", "se"] as const) {
      for (const dx of [-9999, -120, -1, 0, 1, 120, 9999]) {
        expect(inside(resizeLayer(layer(), corner, dx, canvas))).toBe(true);
      }
    }
  });

  it("does not change its input", () => {
    const original = layer();
    resizeLayer(original, "se", 80, canvas);
    expect(original).toEqual(layer());
  });
});

describe("scaleLayer", () => {
  it("carries the position along and keeps the shape when the canvas is rotated", () => {
    const scaled = scaleLayer(layer(), { w: 800, h: 600 }, { w: 600, h: 800 });
    expect(scaled.w / scaled.h).toBeCloseTo(2, 10);
    expect(inside(scaled, { w: 600, h: 800 })).toBe(true);
  });

  it("scales evenly when only the size changes", () => {
    const scaled = scaleLayer(layer(), { w: 800, h: 600 }, { w: 400, h: 300 });
    expect(scaled).toMatchObject({ x: 50, y: 50, w: 100, h: 50 });
  });

  it("pulls a layer back inside a much smaller canvas", () => {
    const scaled = scaleLayer(layer({ x: 600, w: 200 }), { w: 800, h: 600 }, { w: 100, h: 100 });
    expect(inside(scaled, { w: 100, h: 100 })).toBe(true);
  });

  it("returns the layer unchanged when the old size is unknown", () => {
    const original = layer();
    expect(scaleLayer(original, { w: 0, h: 0 }, canvas)).toBe(original);
  });
});

describe("fitRect", () => {
  it("shrinks a too-large rectangle to fit while keeping its shape", () => {
    const rect = fitRect({ x: 0, y: 0, w: 1600, h: 600 }, canvas);
    expect(rect.w).toBe(800);
    expect(rect.h).toBe(300);
  });
});

describe("bringToFront", () => {
  const stack = [layer({ id: "a" }), layer({ id: "b" }), layer({ id: "c" })];

  it("moves the layer to the end, leaving the others in order", () => {
    expect(bringToFront(stack, "a").map((l) => l.id)).toEqual(["b", "c", "a"]);
  });

  it("changes nothing for the top layer or an unknown id", () => {
    expect(bringToFront(stack, "c").map((l) => l.id)).toEqual(["a", "b", "c"]);
    expect(bringToFront(stack, "zzz").map((l) => l.id)).toEqual(["a", "b", "c"]);
  });
});

describe("saving layers", () => {
  const layers = [
    layer({ id: "a", mediaId: "media-tabel-1", x: 10.126, y: 20, w: 300, h: 150 }),
    layer({ id: "b", mediaId: "media-diagram-2", x: 400, y: 50, w: 120, h: 80 }),
  ];

  it("stores the media id and position, in stacking order", () => {
    expect(toDocumentLayers(layers)).toEqual([
      { media_id: "media-tabel-1", x: 10.13, y: 20, w: 300, h: 150 },
      { media_id: "media-diagram-2", x: 400, y: 50, w: 120, h: 80 },
    ]);
  });

  it("puts media ids, not image pixels, into the serialized file", () => {
    const doc = createEmptyDocument(800, 600);
    doc.layers = toDocumentLayers(layers);
    const bytes = serialize(doc);
    const restored = deserialize(bytes);

    expect(restored.layers.map((l) => l.media_id)).toEqual(["media-tabel-1", "media-diagram-2"]);

    const json = JSON.stringify(restored);
    expect(json).toContain("media_id");
    expect(json).not.toMatch(/data:image|base64|<svg|<table/i);
    // The only keys a saved layer can have are its media id and its position.
    for (const saved of restored.layers) {
      expect(Object.keys(saved).sort()).toEqual(["h", "media_id", "w", "x", "y"]);
    }
  });

  it("keeps the file tiny: it holds a reference, whatever the size of the media", () => {
    const doc = createEmptyDocument(800, 600);
    doc.layers = toDocumentLayers(layers);
    expect(serialize(doc).byteLength).toBeLessThan(300);
  });

  it("reads layers back with fresh ids and the same media and position", () => {
    const saved = toDocumentLayers(layers);
    const back = fromDocumentLayers(saved, (i) => `restored-${i}`);
    expect(back.map((l) => [l.id, l.mediaId, l.x, l.y, l.w, l.h])).toEqual([
      ["restored-0", "media-tabel-1", 10.13, 20, 300, 150],
      ["restored-1", "media-diagram-2", 400, 50, 120, 80],
    ]);
  });

  it("round-trips an empty layer list", () => {
    expect(toDocumentLayers([])).toEqual([]);
    expect(fromDocumentLayers([])).toEqual([]);
  });
});
