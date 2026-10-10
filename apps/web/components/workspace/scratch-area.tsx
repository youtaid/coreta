import type { Stroke } from "@coreta/ink";
import { PencilLine } from "lucide-react";

import { cn } from "@/lib/utils";

import { InkCanvas } from "./ink-canvas";
import { PasteLayerSurface, type PastedMedia } from "./paste-layer";

export interface ScratchAreaProps {
  className?: string;
  label?: string;
  /** Media pasted onto this area; shown beneath the ink. */
  pasted?: readonly PastedMedia[];
  onRemovePasted?: (id: string) => void;
  /** Current strokes (for question persistence) */
  strokes?: Stroke[];
  /** Callback fired whenever strokes change */
  onStrokesChange?: (strokes: Stroke[]) => void;
}

/**
 * Grid scratchpad area for the single-screen workspace: 24px grid paper with the digital ink
 * canvas (pen, eraser, undo, redo, clear) drawn on top of it.
 */
export function ScratchArea({
  className,
  label = "Area Coretan",
  pasted = [],
  onRemovePasted,
  strokes,
  onStrokesChange,
}: ScratchAreaProps) {
  return (
    <section
      aria-label={label}
      className={cn(
        "relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-card/50 shadow-xs backdrop-blur-xs select-none",
        className,
      )}
    >
      {/* Mathematical 24px square grid background */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="workspace-grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-border/60 dark:text-border/40"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#workspace-grid-pattern)" />
      </svg>

      {/* Toolbar and drawing canvas, on top of the grid. */}
      <InkCanvas
        strokes={strokes}
        onStrokesChange={onStrokesChange}
        layerCount={pasted.length}
        renderUnderlay={(interactive) => (
          <PasteLayerSurface
            pasted={pasted}
            interactive={interactive}
            onRemove={(id) => onRemovePasted?.(id)}
          />
        )}
        header={
          <span className="flex items-center gap-1.5 font-medium">
            <PencilLine className="size-3.5 shrink-0 text-primary" />
            <span className="truncate">{label}</span>
            <span className="hidden text-[11px] text-muted-foreground/70 sm:inline">
              (Kertas Berpetak 24px)
            </span>
          </span>
        }
      />
    </section>
  );
}
