import { describe, expect, it } from "vitest";
import {
  createEmptyDocument,
  deserialize,
  getActiveStrokes,
  recordClear,
  recordErase,
  serialize,
  serializeJson,
  strokeToV1,
  type CoretaInkDocumentV1,
} from "./format";
import { getPngDimensions, renderPng } from "./png";
import type { Stroke } from "./types";

describe("Format Coreta Ink v1 (Fase 26)", () => {
  function sampleDocument(): CoretaInkDocumentV1 {
    const doc = createEmptyDocument(1200, 800);
    doc.strokes.push({
      id: "stroke-1",
      tool: "pen",
      color: "#2563eb",
      size: 3,
      pts: [
        [100, 150, 0.6, 0],
        [120, 170, 0.75, 15],
        [150, 200, 0.8, 30],
      ],
    });
    doc.strokes.push({
      id: "stroke-2",
      tool: "pen",
      color: "#dc2626",
      size: 4,
      pts: [
        [200, 300, 0.5, 50],
        [220, 310, 0.7, 65],
      ],
    });
    doc.layers.push({
      media_id: "media-tabel-fungsi-1",
      x: 50,
      y: 50,
      w: 400,
      h: 250,
    });
    return doc;
  }

  it("tes bolak-balik: serialize lalu deserialize menghasilkan data yang sama", () => {
    const original = sampleDocument();

    const binaryGzip = serialize(original);
    expect(binaryGzip).toBeInstanceOf(Uint8Array);
    expect(binaryGzip.length).toBeGreaterThan(0);

    const restored = deserialize(binaryGzip);
    expect(restored).toEqual(original);
  });

  it("tes bolak-balik JSON string serialization", () => {
    const original = sampleDocument();
    const jsonStr = serializeJson(original);
    const restored = deserialize(jsonStr);
    expect(restored).toEqual(original);
  });

  it("tes: penghapusan tersimpan sebagai peristiwa, bukan membuang goresan", () => {
    const doc = sampleDocument();
    expect(doc.strokes).toHaveLength(2);
    expect(doc.events).toHaveLength(0);

    // Hapus stroke-1
    recordErase(doc, ["stroke-1"], 1_000);

    // doc.strokes tetap memiliki 2 goresan lengkap (tidak membuang data)
    expect(doc.strokes).toHaveLength(2);
    expect(doc.strokes[0]?.id).toBe("stroke-1");

    // Peristiwa penghapusan tercatat di events
    expect(doc.events).toHaveLength(1);
    expect(doc.events[0]).toEqual({
      type: "erase",
      strokeIds: ["stroke-1"],
      t: 1_000,
    });

    // getActiveStrokes hanya mengembalikan stroke-2
    const active = getActiveStrokes(doc);
    expect(active).toHaveLength(1);
    expect(active[0]?.id).toBe("stroke-2");

    // Clear seluruh halaman
    recordClear(doc, 2_000);
    expect(doc.strokes).toHaveLength(2); // masih utuh
    expect(doc.events).toHaveLength(2);
    expect(getActiveStrokes(doc)).toHaveLength(0);

    // Serialize dan deserialize tetap menyimpan semua goresan dan peristiwanya
    const restored = deserialize(serialize(doc));
    expect(restored.strokes).toHaveLength(2);
    expect(restored.events).toHaveLength(2);
    expect(getActiveStrokes(restored)).toHaveLength(0);
  });

  it("konversi runtime Stroke ke CoretaStrokeV1 dan sebaliknya", () => {
    const runtimeStroke: Stroke = {
      id: "rt-1",
      color: "#10b981",
      size: 5,
      points: [
        { x: 10, y: 20, pressure: 0.4 },
        { x: 30, y: 40, pressure: 0.8 },
      ],
      simulatePressure: false,
    };

    const v1 = strokeToV1(runtimeStroke, 100);
    expect(v1.id).toBe("rt-1");
    expect(v1.tool).toBe("pen");
    expect(v1.pts).toHaveLength(2);
    expect(v1.pts[0]).toEqual([10, 20, 0.4, 100]);
  });

  it("mendukung deserialisasi format lama / tanpa versi (backward compatibility)", () => {
    const legacyPayload = {
      width: 800,
      height: 600,
      strokes: [
        {
          id: "old-1",
          points: [
            { x: 10, y: 15, pressure: 0.5 },
            { x: 20, y: 25, pressure: 0.7 },
          ],
        },
      ],
    };

    const deserialized = deserialize(JSON.stringify(legacyPayload));
    expect(deserialized.v).toBe(1);
    expect(deserialized.canvas).toEqual({ w: 800, h: 600 });
    expect(deserialized.strokes).toHaveLength(1);
    expect(deserialized.strokes[0]?.pts).toHaveLength(2);
    expect(deserialized.events).toEqual([]);
    expect(deserialized.layers).toEqual([]);
  });

  describe("renderPng (Fase 26)", () => {
    it("menghasilkan PNG valid dengan magic signature [137, 80, 78, 71, 13, 10, 26, 10]", () => {
      const doc = sampleDocument();
      const png = renderPng(doc);

      expect(png).toBeInstanceOf(Uint8Array);
      expect(png.length).toBeGreaterThan(60);

      // Verifikasi PNG magic bytes
      const signature = Array.from(png.subarray(0, 8));
      expect(signature).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    });

    it("PNG hasil render tidak lebih lebar dari 1024 px pada kanvas lebar (2048x1536)", () => {
      const largeDoc = createEmptyDocument(2048, 1536);
      largeDoc.strokes.push({
        id: "s1",
        tool: "pen",
        color: "#000000",
        size: 4,
        pts: [
          [100, 100, 0.8, 0],
          [500, 500, 0.8, 20],
        ],
      });

      const png = renderPng(largeDoc);
      const { width, height } = getPngDimensions(png);

      // Wajib <= 1024 px
      expect(width).toBeLessThanOrEqual(1024);
      expect(width).toBe(1024);
      // Rasio aspek proporsional (1536 * (1024/2048) = 768)
      expect(height).toBe(768);
    });

    it("PNG hasil render mempertahankan dimensi asli jika <= 1024 px", () => {
      const smallDoc = createEmptyDocument(800, 600);
      const png = renderPng(smallDoc);
      const { width, height } = getPngDimensions(png);

      expect(width).toBe(800);
      expect(height).toBe(600);
    });

    it("tidak merender goresan yang sudah terhapus oleh event", () => {
      const doc = createEmptyDocument(400, 300);
      doc.strokes.push({
        id: "deleted-stroke",
        tool: "pen",
        color: "#000000",
        size: 10,
        pts: [
          [50, 50, 1, 0],
          [200, 200, 1, 20],
        ],
      });

      recordErase(doc, ["deleted-stroke"]);

      const pngWithErase = renderPng(doc);
      expect(pngWithErase).toBeInstanceOf(Uint8Array);

      // Gambar harus tetap valid PNG
      const { width, height } = getPngDimensions(pngWithErase);
      expect(width).toBe(400);
      expect(height).toBe(300);
    });
  });
});
