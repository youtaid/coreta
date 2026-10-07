// Format Coreta Ink v1 (Fase 26).
// Defines the file format for digital ink drawings in Coreta:
// {
//   v: 1,
//   canvas: { w, h },
//   strokes: [{ id, tool, pts: [[x, y, tekanan, ms]] }],
//   events: [...penghapusan],
//   layers: [{ media_id, ... }]
// }
//
// Key principles:
// - `serialize` produces JSON then compresses with gzip via `fflate`.
// - `deserialize` decompresses gzip and supports legacy/unversioned payloads.
// - Erasure is stored as an event (`events`), never dropping the original stroke data.
// - Pure functions: no DOM dependencies.

import { gunzipSync, gzipSync } from "fflate";
import type { InkPoint, Stroke } from "./types";

/** Tuple representing [x, y, tekanan, ms]. */
export type PointTuple = [x: number, y: number, tekanan: number, ms: number];

export interface CoretaStrokeV1 {
  id: string;
  tool: "pen" | "eraser";
  color?: string;
  size?: number;
  pts: PointTuple[];
  simulatePressure?: boolean;
}

export type CoretaEventV1 =
  { type: "erase"; strokeIds: string[]; t: number } | { type: "clear"; t: number };

export interface CoretaLayerV1 {
  media_id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  opacity?: number;
}

export interface CoretaInkDocumentV1 {
  v: 1;
  canvas: {
    w: number;
    h: number;
  };
  strokes: CoretaStrokeV1[];
  events: CoretaEventV1[];
  layers: CoretaLayerV1[];
}

export type CoretaInkDocument = CoretaInkDocumentV1;

/** Creates an empty document with default canvas dimensions. */
export function createEmptyDocument(width = 1024, height = 768): CoretaInkDocumentV1 {
  return {
    v: 1,
    canvas: { w: width, h: height },
    strokes: [],
    events: [],
    layers: [],
  };
}

/** Converts an runtime Stroke object into CoretaStrokeV1 format. */
export function strokeToV1(stroke: Stroke, baseTime = 0): CoretaStrokeV1 {
  return {
    id: stroke.id,
    tool: "pen",
    color: stroke.color,
    size: stroke.size,
    pts: stroke.points.map((pt, index) => [
      pt.x,
      pt.y,
      Number(pt.pressure.toFixed(4)),
      baseTime + index * 10,
    ]),
    simulatePressure: stroke.simulatePressure,
  };
}

/** Converts a CoretaStrokeV1 object back into runtime Stroke format. */
export function v1ToStroke(v1: CoretaStrokeV1): Stroke {
  const points: InkPoint[] = v1.pts.map(([x, y, tekanan]) => ({
    x,
    y,
    pressure: tekanan,
  }));

  return {
    id: v1.id,
    color: v1.color ?? "currentColor",
    size: v1.size ?? 2,
    points,
    simulatePressure: Boolean(v1.simulatePressure),
  };
}

/**
 * Returns all active (non-erased) strokes in the document by replaying erasure events.
 * Original strokes remain in `doc.strokes` for full stroke analytics and auditability.
 */
export function getActiveStrokes(doc: CoretaInkDocumentV1): CoretaStrokeV1[] {
  const erasedIds = new Set<string>();

  for (const event of doc.events) {
    if (event.type === "erase") {
      for (const id of event.strokeIds) erasedIds.add(id);
    } else if (event.type === "clear") {
      for (const stroke of doc.strokes) erasedIds.add(stroke.id);
    }
  }

  return doc.strokes.filter((stroke) => !erasedIds.has(stroke.id));
}

/**
 * Records an erasure event without deleting the strokes from `doc.strokes`.
 */
export function recordErase(
  doc: CoretaInkDocumentV1,
  strokeIds: Iterable<string>,
  timestamp = Date.now(),
): void {
  const ids = Array.from(strokeIds);
  if (ids.length === 0) return;
  doc.events.push({
    type: "erase",
    strokeIds: ids,
    t: timestamp,
  });
}

/**
 * Records a page clear event without deleting the strokes from `doc.strokes`.
 */
export function recordClear(doc: CoretaInkDocumentV1, timestamp = Date.now()): void {
  doc.events.push({
    type: "clear",
    t: timestamp,
  });
}

/** Serializes document to formatted or compact JSON string. */
export function serializeJson(doc: CoretaInkDocumentV1, pretty = false): string {
  return JSON.stringify(doc, null, pretty ? 2 : undefined);
}

/**
 * Serializes document to gzip-compressed binary Uint8Array using fflate.
 */
export function serialize(doc: CoretaInkDocumentV1): Uint8Array {
  const json = serializeJson(doc);
  const utf8 = new TextEncoder().encode(json);
  return gzipSync(utf8);
}

/**
 * Checks if buffer starts with gzip magic header (0x1f, 0x8b).
 */
function isGzip(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

/**
 * Deserializes gzip bytes or JSON string into CoretaInkDocumentV1.
 * Supports backward-compatibility for unversioned or legacy formats.
 */
export function deserialize(data: Uint8Array | string): CoretaInkDocumentV1 {
  let jsonString: string;

  if (typeof data === "string") {
    jsonString = data;
  } else {
    const rawBytes = isGzip(data) ? gunzipSync(data) : data;
    jsonString = new TextDecoder().decode(rawBytes);
  }

  const parsed = JSON.parse(jsonString) as Record<string, unknown>;

  // Check version and migrate if necessary
  return migrateToV1(parsed);
}

/**
 * Migrates legacy/unversioned document objects to CoretaInkDocumentV1.
 */
function migrateToV1(raw: Record<string, unknown>): CoretaInkDocumentV1 {
  const canvasRaw = (raw.canvas as { w?: number; h?: number } | undefined) ?? {};
  const width = Number(canvasRaw.w ?? raw.width ?? raw.w ?? 1024);
  const height = Number(canvasRaw.h ?? raw.height ?? raw.h ?? 768);

  const rawStrokes = Array.isArray(raw.strokes) ? (raw.strokes as unknown[]) : [];
  const strokes: CoretaStrokeV1[] = [];

  for (let index = 0; index < rawStrokes.length; index += 1) {
    const s = rawStrokes[index] as Record<string, unknown>;
    const id = String(s.id ?? `stroke-${index + 1}`);
    const tool = s.tool === "eraser" ? "eraser" : "pen";
    const color = typeof s.color === "string" ? s.color : undefined;
    const size = typeof s.size === "number" ? s.size : undefined;

    let pts: PointTuple[] = [];
    if (Array.isArray(s.pts)) {
      pts = (s.pts as number[][]).map((p) => [
        Number(p[0] ?? 0),
        Number(p[1] ?? 0),
        Number(p[2] ?? 0.5),
        Number(p[3] ?? 0),
      ]);
    } else if (Array.isArray(s.points)) {
      // Legacy Stroke shape: { points: [{ x, y, pressure }] }
      pts = (s.points as { x?: number; y?: number; pressure?: number }[]).map((p, pIdx) => [
        Number(p.x ?? 0),
        Number(p.y ?? 0),
        Number(p.pressure ?? 0.5),
        pIdx * 10,
      ]);
    }

    const strokeItem: CoretaStrokeV1 = {
      id,
      tool,
      color,
      size,
      pts,
    };
    if (typeof s.simulatePressure === "boolean") {
      strokeItem.simulatePressure = s.simulatePressure;
    }
    strokes.push(strokeItem);
  }

  const events: CoretaEventV1[] = Array.isArray(raw.events) ? (raw.events as CoretaEventV1[]) : [];

  const layers: CoretaLayerV1[] = Array.isArray(raw.layers) ? (raw.layers as CoretaLayerV1[]) : [];

  return {
    v: 1,
    canvas: {
      w: width,
      h: height,
    },
    strokes,
    events,
    layers,
  };
}
