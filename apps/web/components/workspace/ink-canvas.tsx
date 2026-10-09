"use client";

import { InkEngine, type InkState, type Stroke, type Tool } from "@coreta/ink";
import { Eraser, Move, PencilLine, Redo2, Trash2, Undo2 } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface InkCanvasProps {
  /** Shown at the left of the toolbar row, for example the name of the area. */
  header?: ReactNode;
  /**
   * Content drawn beneath the ink, such as pasted media. It is told whether layers are being
   * moved; while they are, the canvas stops catching pointer input so the layers can.
   */
  renderUnderlay?: (layersInteractive: boolean) => ReactNode;
  /** How many layers the underlay holds; the "Geser lapisan" button shows only when there are some. */
  layerCount?: number;
  className?: string;
  /** Current strokes (for question persistence) */
  strokes?: Stroke[];
  /** Callback fired whenever strokes change */
  onStrokesChange?: (strokes: Stroke[]) => void;
}

const initialState: InkState = { tool: "pen", canUndo: false, canRedo: false, strokeCount: 0 };

/**
 * React wrapper around the framework-free InkEngine: a toolbar (pen, eraser, undo, redo, clear)
 * above a drawing canvas that fills the rest of its parent. The engine does the drawing; this
 * component only creates it, keeps its size in step with the layout, and mirrors its state onto
 * the buttons.
 */
export function InkCanvas({
  header,
  renderUnderlay,
  layerCount = 0,
  className,
  strokes,
  onStrokesChange,
}: InkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<InkEngine | null>(null);
  const [state, setState] = useState<InkState>(initialState);
  const [moveMode, setMoveMode] = useState(false);
  const [seenLayerCount, setSeenLayerCount] = useState(layerCount);
  const onStrokesChangeRef = useRef(onStrokesChange);
  const isSyncingRef = useRef(false);
  const initialStrokesRef = useRef(strokes);

  useEffect(() => {
    onStrokesChangeRef.current = onStrokesChange;
  }, [onStrokesChange]);

  // A newly pasted layer switches to move mode so it can be positioned straight away.
  if (layerCount !== seenLayerCount) {
    setSeenLayerCount(layerCount);
    if (layerCount > seenLayerCount) setMoveMode(true);
  }
  const layersInteractive = moveMode && layerCount > 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new InkEngine(canvas, {
      initialStrokes: initialStrokesRef.current,
    });
    engineRef.current = engine;
    const stopListening = engine.onChange((nextState) => {
      setState(nextState);
      if (!isSyncingRef.current) {
        onStrokesChangeRef.current?.(engine.getStrokes());
      }
    });

    // The layout changes with the window and with rotation; keep the drawing buffer matched to it.
    const sizeObserver = new ResizeObserver(() => engine.resize());
    sizeObserver.observe(canvas);

    // Ink uses the canvas's text color, so it has to be redrawn when the theme class changes.
    const themeObserver = new MutationObserver(() => engine.redraw());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      themeObserver.disconnect();
      sizeObserver.disconnect();
      stopListening();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Synchronize strokes when question changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const current = engine.getStrokes();
    const incoming = strokes ?? [];
    if (current === incoming) return;
    if (current.length === incoming.length && current.every((s, i) => s.id === incoming[i]?.id)) {
      return;
    }
    isSyncingRef.current = true;
    try {
      engine.loadStrokes(incoming);
    } finally {
      isSyncingRef.current = false;
    }
  }, [strokes]);

  const selectTool = (tool: Tool) => engineRef.current?.setTool(tool);

  return (
    <div className={cn("relative z-10 flex h-full min-h-0 flex-col", className)}>
      <div
        role="toolbar"
        aria-label="Alat coretan"
        className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-background/70 px-2 py-1 backdrop-blur-xs"
      >
        <div className="min-w-0 truncate px-1 text-xs text-muted-foreground">{header}</div>
        <div className="flex shrink-0 items-center gap-1">
          {layerCount > 0 && (
            <Button
              type="button"
              size="icon"
              variant={layersInteractive ? "default" : "outline"}
              aria-pressed={layersInteractive}
              aria-label="Geser lapisan"
              title="Geser lapisan"
              onClick={() => setMoveMode((value) => !value)}
            >
              <Move />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant={state.tool === "pen" ? "default" : "outline"}
            aria-pressed={state.tool === "pen"}
            aria-label="Pena"
            title="Pena"
            onClick={() => selectTool("pen")}
          >
            <PencilLine />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={state.tool === "eraser" ? "default" : "outline"}
            aria-pressed={state.tool === "eraser"}
            aria-label="Penghapus"
            title="Penghapus"
            onClick={() => selectTool("eraser")}
          >
            <Eraser />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Urungkan"
            title="Urungkan"
            disabled={!state.canUndo}
            onClick={() => engineRef.current?.undo()}
          >
            <Undo2 />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Ulangi"
            title="Ulangi"
            disabled={!state.canRedo}
            onClick={() => engineRef.current?.redo()}
          >
            <Redo2 />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Bersihkan"
            title="Bersihkan"
            disabled={state.strokeCount === 0}
            onClick={() => engineRef.current?.clear()}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {renderUnderlay?.(layersInteractive)}
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Kertas coretan. Gambar dengan pena atau jari."
          className={cn(
            "absolute inset-0 h-full w-full text-foreground",
            layersInteractive && "pointer-events-none",
          )}
        />
      </div>
    </div>
  );
}
