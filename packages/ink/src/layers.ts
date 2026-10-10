// Paste layers: pieces of media (a table, a diagram) the student pastes onto the scratch area to
// write on top of. A layer is only a reference to the media plus where it sits; the media itself
// is never copied into the ink file (the saved layer carries `media_id`, not pixels).
//
// Everything here is pure geometry in canvas pixels, so it can be tested without a DOM.

import type { CoretaLayerV1 } from "./format";

export interface CanvasSize {
  w: number;
  h: number;
}

export interface LayerRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PasteLayer extends LayerRect {
  /** Runtime id for this pasted copy; it is not part of the saved file. */
  id: string;
  /** The media this layer shows. */
  mediaId: string;
}

export type Corner = "nw" | "ne" | "sw" | "se";

/** The shorter side of a layer never goes below this, so it stays easy to grab. */
export const MIN_LAYER_SIZE = 48;

/** A fresh layer covers at most this share of the canvas, so there is room to write around it. */
export const INITIAL_SHARE = 0.6;

/** Each further pasted layer is offset by this much, so copies do not hide each other exactly. */
export const CASCADE_STEP = 24;
const CASCADE_COUNT = 5;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Shrinks a rectangle that is bigger than the canvas (keeping its shape), then moves it inside. */
export function fitRect(rect: LayerRect, canvas: CanvasSize): LayerRect {
  const shrink = Math.min(1, canvas.w / rect.w, canvas.h / rect.h);
  const w = rect.w * shrink;
  const h = rect.h * shrink;
  return {
    x: clamp(rect.x, 0, Math.max(0, canvas.w - w)),
    y: clamp(rect.y, 0, Math.max(0, canvas.h - h)),
    w,
    h,
  };
}

/**
 * Where a newly pasted layer goes: centred, covering up to 60% of the canvas, with the given
 * width-to-height `aspect`. `index` is how many layers are already pasted, which nudges the new
 * one down and to the right.
 */
export function placeLayer(aspect: number, canvas: CanvasSize, index = 0): LayerRect {
  const safeAspect = aspect > 0 && Number.isFinite(aspect) ? aspect : 1;
  let w = Math.min(canvas.w * INITIAL_SHARE, canvas.h * INITIAL_SHARE * safeAspect);
  let h = w / safeAspect;
  const shortSide = Math.min(w, h);
  if (shortSide < MIN_LAYER_SIZE) {
    const grow = MIN_LAYER_SIZE / shortSide;
    w *= grow;
    h *= grow;
  }
  const offset = (index % CASCADE_COUNT) * CASCADE_STEP;
  return fitRect({ x: (canvas.w - w) / 2 + offset, y: (canvas.h - h) / 2 + offset, w, h }, canvas);
}

/** Moves a layer by (dx, dy), stopping at the canvas edges so it can never be dragged away. */
export function moveLayer(
  layer: PasteLayer,
  dx: number,
  dy: number,
  canvas: CanvasSize,
): PasteLayer {
  const moved = fitRect({ x: layer.x + dx, y: layer.y + dy, w: layer.w, h: layer.h }, canvas);
  return { ...layer, x: moved.x, y: moved.y };
}

/**
 * Resizes a layer by dragging one corner `dx` pixels to the right (negative: left). The opposite
 * corner stays where it is and the layer keeps its shape, so only the horizontal drag matters. The
 * size is limited to at least MIN_LAYER_SIZE on the shorter side and to what fits on the canvas
 * from the fixed corner.
 */
export function resizeLayer(
  layer: PasteLayer,
  corner: Corner,
  dx: number,
  canvas: CanvasSize,
): PasteLayer {
  const aspect = layer.w / layer.h;
  const east = corner.includes("e");
  const south = corner.includes("s");

  const anchorX = east ? layer.x : layer.x + layer.w;
  const anchorY = south ? layer.y : layer.y + layer.h;
  const roomX = east ? canvas.w - anchorX : anchorX;
  const roomY = south ? canvas.h - anchorY : anchorY;

  const desired = east ? layer.w + dx : layer.w - dx;
  const minW = Math.max(MIN_LAYER_SIZE, MIN_LAYER_SIZE * aspect);
  const maxW = Math.min(roomX, roomY * aspect);
  const w = Math.min(Math.max(desired, minW), maxW);
  const h = w / aspect;

  return {
    ...layer,
    x: east ? anchorX : anchorX - w,
    y: south ? anchorY : anchorY - h,
    w,
    h,
  };
}

/**
 * Carries a layer from one canvas size to another, as when the tablet is rotated: its position
 * follows the canvas and its size scales by the smaller factor, so it keeps its shape and still fits.
 */
export function scaleLayer(layer: PasteLayer, from: CanvasSize, to: CanvasSize): PasteLayer {
  if (from.w <= 0 || from.h <= 0) return layer;
  const sx = to.w / from.w;
  const sy = to.h / from.h;
  const size = Math.min(sx, sy);
  const fitted = fitRect(
    { x: layer.x * sx, y: layer.y * sy, w: layer.w * size, h: layer.h * size },
    to,
  );
  return { ...layer, ...fitted };
}

/** Moves a layer to the front of the stack (the end of the list), where it is drawn last. */
export function bringToFront(layers: readonly PasteLayer[], id: string): PasteLayer[] {
  const target = layers.find((layer) => layer.id === id);
  if (!target) return [...layers];
  return [...layers.filter((layer) => layer.id !== id), target];
}

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * The layers as they are saved in a Coreta ink file: the media id and the position, in stacking
 * order. There is no field that could hold the image, so pixels can never end up in the file.
 */
export function toDocumentLayers(layers: readonly PasteLayer[]): CoretaLayerV1[] {
  return layers.map((layer) => ({
    media_id: layer.mediaId,
    x: round(layer.x),
    y: round(layer.y),
    w: round(layer.w),
    h: round(layer.h),
  }));
}

/** Layers read back from a saved file, each given a fresh runtime id. */
export function fromDocumentLayers(
  layers: readonly CoretaLayerV1[],
  createId: (index: number) => string = (index) => `layer-${index + 1}`,
): PasteLayer[] {
  return layers.map((layer, index) => ({
    id: createId(index),
    mediaId: layer.media_id,
    x: layer.x,
    y: layer.y,
    w: layer.w,
    h: layer.h,
  }));
}
