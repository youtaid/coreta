import { BookOpen, FileText, Info } from "lucide-react";

import type { WorkspaceStimulus } from "@/lib/domain";
import { countWords } from "@/lib/workspace-fit";
import { cn } from "@/lib/utils";

export interface ReadingPanelProps {
  stimulus: WorkspaceStimulus;
  className?: string;
}

/**
 * ReadingPanel displays the long reading stimulus in reading layout mode.
 * As dictated by Rule 9: This is the ONLY component allowed to have internal
 * vertical scrolling (overflow-y-auto), while the parent workspace stays fixed.
 */
export function ReadingPanel({ stimulus, className }: ReadingPanelProps) {
  const paragraphs = stimulus.bodyText
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);
  const wordCount = countWords(stimulus.bodyText);

  return (
    <section
      aria-label="Panel Stimulus Bacaan"
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs",
        className,
      )}
    >
      {/* Header with stimulus info */}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/60 bg-muted/40 p-3.5">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
              <BookOpen className="size-3.5" />
              Stimulus Bacaan
            </span>
            <span className="text-xs text-muted-foreground">{wordCount} kata</span>
          </div>
          <h2 className="font-heading truncate text-base font-bold text-foreground">
            {stimulus.title}
          </h2>
          {stimulus.subtitle && (
            <p className="line-clamp-1 text-xs text-muted-foreground">{stimulus.subtitle}</p>
          )}
        </div>
      </div>

      {/* Internal scrollable content area — ONLY area in workspace that scrolls */}
      <div
        data-testid="reading-panel-scroll"
        // Focusable so keyboard users can scroll it with the arrow keys.
        tabIndex={0}
        role="region"
        aria-label={`Teks bacaan: ${stimulus.title}`}
        className="min-h-0 flex-1 touch-pan-y space-y-3.5 overflow-y-auto overscroll-contain p-4 pr-3.5 text-sm leading-relaxed text-foreground/90 outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary dark:bg-primary/10">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>Baca teks berikut dengan cermat, lalu kerjakan soal di samping.</p>
        </div>

        {paragraphs.map((para, index) => {
          if (para.startsWith("•") || para.includes("\n•")) {
            const items = para.split("\n").filter((line) => line.trim().startsWith("•"));
            return (
              <ul
                key={index}
                className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs sm:text-sm"
              >
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item.replace(/^•\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            );
          }

          return (
            <p key={index} className="text-xs text-foreground/90 sm:text-sm">
              {para}
            </p>
          );
        })}

        {stimulus.source && (
          <div className="mt-4 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="size-3" />
              <span>Sumber: {stimulus.source}</span>
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
