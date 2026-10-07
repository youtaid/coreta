"use client";

import {
  type CanvasSize,
  type Corner,
  moveLayer,
  type PasteLayer as PasteLayerData,
  placeLayer,
  resizeLayer,
  scaleLayer,
} from "@coreta/ink";
import { Maximize2, X } from "lucide-react";
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";

import type { WorkspaceMedia } from "@/lib/domain";
import { cn } from "@/lib/utils";

import { ImageMedia } from "./media/image-media";
import { TableMedia } from "./media/table-media";

/** A copy of a media item the student pasted onto the scratch area. */
export interface PastedMedia {
  id: string;
  /** Order in which it was pasted; fixes where it first appears, even after others are removed. */
  slot: number;
  media: WorkspaceMedia;
}

export interface PasteLayerSurfaceProps {
  pasted: readonly PastedMedia[];
  /** When true the layers can be moved and resized, and the ink canvas steps aside. */
  interactive: boolean;
  onRemove: (id: string) => void;
  className?: string;
}

/**
 * The size, in pixels, each kind of media is laid out at before being scaled to its layer. Laying
 * it out at a fixed size and scaling the result makes a layer behave like a picture: resizing
 * enlarges or shrinks it instead of re-flowing a table into a box too small for it.
 */
const REFERENCE: Record<WorkspaceMedia["kind"], { w: number; h: number }> = {
  table: { w: 760, h: 475 },
  diagram: { w: 560, h: 400 },
  image: { w: 640, h: 480 },
  audio: { w: 640, h: 320 },
  video: { w: 640, h: 360 },
};

const KEY_STEP = 16;

interface Placed {
  layer: PasteLayerData;
  /** Canvas size the geometry was measured for, so it can follow a rotation. */
  canvas: CanvasSize;
}

interface Gesture {
  pointerId: number;
  kind: "move" | Corner;
  startX: number;
  startY: number;
  origin: PasteLayerData;
}

/**
 * Pasted media shown beneath the ink canvas, so the student writes on top of it. In interactive
 * mode each layer can be dragged (pen, finger, or mouse), resized from its corner handle, moved with
 * the arrow keys, and removed. Layers only reference their media; nothing here copies an image.
 *
 * Positions are kept per layer once the student changes them; until then each layer sits at the
 * place `placeLayer` gives it. Geometry is rescaled when the canvas changes size.
 */
export function PasteLayerSurface({
  pasted,
  interactive,
  onRemove,
  className,
}: PasteLayerSurfaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<CanvasSize>({ w: 0, h: 0 });
  const [edited, setEdited] = useState<Record<string, Placed>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const gesture = useRef<Gesture | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.contentRect;
      if (box) setCanvas({ w: box.width, h: box.height });
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const hasSize = canvas.w > 0 && canvas.h > 0;

  // The layer as it should be drawn now: the student's edit (rescaled to the current canvas), or
  // the starting placement.
  function layerFor(item: PastedMedia): PasteLayerData {
    const saved = edited[item.id];
    if (saved) {
      const same = saved.canvas.w === canvas.w && saved.canvas.h === canvas.h;
      return same ? saved.layer : scaleLayer(saved.layer, saved.canvas, canvas);
    }
    const reference = REFERENCE[item.media.kind];
    const rect = placeLayer(reference.w / reference.h, canvas, item.slot);
    return { id: item.id, mediaId: item.media.id, ...rect };
  }

  function commit(layer: PasteLayerData) {
    setEdited((current) => ({ ...current, [layer.id]: { layer, canvas } }));
  }

  function begin(event: PointerEvent<HTMLElement>, layer: PasteLayerData, kind: Gesture["kind"]) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    gesture.current = {
      pointerId: event.pointerId,
      kind,
      startX: event.clientX,
      startY: event.clientY,
      origin: layer,
    };
    setActiveId(layer.id);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer already ended; the drag simply will not start.
    }
  }

  function drag(event: PointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    commit(
      current.kind === "move"
        ? moveLayer(current.origin, dx, dy, canvas)
        : resizeLayer(current.origin, current.kind, dx, canvas),
    );
  }

  function end(event: PointerEvent<HTMLElement>) {
    if (gesture.current?.pointerId === event.pointerId) gesture.current = null;
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>, layer: PasteLayerData) {
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    };
    const step = arrows[event.key];
    if (step) {
      event.preventDefault();
      // Shift with an arrow resizes (left/up shrink, right/down grow); plain arrows move.
      commit(
        event.shiftKey
          ? resizeLayer(layer, "se", step[0] + step[1], canvas)
          : moveLayer(layer, step[0], step[1], canvas),
      );
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onRemove(layer.id);
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {hasSize &&
        pasted.map((item) => {
          const layer = layerFor(item);
          const title = item.media.title ?? "Media";
          return (
            <div
              key={item.id}
              data-testid="paste-layer"
              data-media-id={item.media.id}
              role={interactive ? "group" : undefined}
              aria-label={interactive ? `Lapisan tempel: ${title}` : undefined}
              tabIndex={interactive ? 0 : undefined}
              onKeyDown={interactive ? (event) => onKeyDown(event, layer) : undefined}
              style={{ left: layer.x, top: layer.y, width: layer.w, height: layer.h }}
              className={cn(
                "absolute overflow-hidden rounded-lg border bg-card shadow-md",
                interactive
                  ? "pointer-events-auto cursor-move touch-none border-primary ring-2 ring-primary/30 outline-none focus-visible:ring-4 focus-visible:ring-ring"
                  : "border-border/70",
                activeId === item.id && interactive && "z-10",
              )}
              onPointerDown={interactive ? (event) => begin(event, layer, "move") : undefined}
              onPointerMove={interactive ? drag : undefined}
              onPointerUp={interactive ? end : undefined}
              onPointerCancel={interactive ? end : undefined}
            >
              {/* The copy is a picture to write on: nothing inside it is clickable or focusable. */}
              <div
                inert
                className="origin-top-left"
                style={{
                  width: REFERENCE[item.media.kind].w,
                  height: REFERENCE[item.media.kind].h,
                  transform: `scale(${layer.w / REFERENCE[item.media.kind].w})`,
                }}
              >
                {item.media.kind === "table" ? (
                  <TableMedia media={item.media} className="overflow-hidden" />
                ) : (
                  <ImageMedia media={item.media} />
                )}
              </div>

              {interactive && (
                <>
                  <button
                    type="button"
                    aria-label={`Hapus lapisan ${title}`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => onRemove(item.id)}
                    className="absolute top-0 right-0 grid size-touch place-items-center rounded-bl-lg bg-background/90 text-foreground outline-none hover:bg-destructive hover:text-white focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                  <div
                    role="presentation"
                    aria-hidden
                    onPointerDown={(event) => begin(event, layer, "se")}
                    onPointerMove={drag}
                    onPointerUp={end}
                    onPointerCancel={end}
                    className="absolute right-0 bottom-0 grid size-touch cursor-nwse-resize touch-none place-items-end rounded-tl-lg bg-primary/90 p-1.5 text-primary-foreground"
                  >
                    <Maximize2 className="size-4" aria-hidden />
                  </div>
                </>
              )}
            </div>
          );
        })}
    </div>
  );
}
