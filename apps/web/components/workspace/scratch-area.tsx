import { Grid3X3, PencilLine } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ScratchAreaProps {
  className?: string;
  label?: string;
}

/**
 * Grid scratchpad area for the single-screen workspace.
 * In Phase 10, this provides the mathematical 24px grid paper layout.
 * Digital ink engine (Pointer Events & perfect-freehand) is added in Phase 25.
 */
export function ScratchArea({ className, label = "Area Coretan" }: ScratchAreaProps) {
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

      {/* Top watermark / label badge */}
      <div className="relative z-10 flex items-center justify-between border-b border-border/40 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <PencilLine className="size-3.5 text-primary" />
          <span>{label}</span>
          <span className="hidden text-[11px] text-muted-foreground/70 sm:inline">
            (Kertas Berpetak 24px)
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
          <Grid3X3 className="size-3" />
          <span>Satu Layar</span>
        </div>
      </div>

      {/* Central informational placeholder */}
      <div className="pointer-events-none relative z-0 flex flex-1 flex-col items-center justify-center p-4 text-center">
        <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary/60 dark:bg-primary/20 dark:text-primary/70">
          <Grid3X3 className="size-5" />
        </div>
        <p className="max-w-xs text-xs font-semibold text-foreground/75">
          Kotak berpetak siap untuk coretan dan pembuktian
        </p>
        <p className="mt-1 max-w-sm text-[11px] text-muted-foreground/70">
          Mencoret langsung di layar tablet dengan pena/stylus. Mesin tinta digital terintegrasi di
          Fase 25.
        </p>
      </div>
    </section>
  );
}
