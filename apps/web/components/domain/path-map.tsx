import { PathNode } from "@/components/domain/path-node";
import type { Stage } from "@/lib/domain";
import { cn } from "@/lib/utils";

interface PathMapProps {
  stages: readonly Stage[];
  /** Destination for an open stage; locked stages never link. */
  stageHref?: (stage: Stage) => string;
  className?: string;
}

/**
 * The Tahap 0-8 map: a vertical list joined by a line on phones, a three-column grid of cards
 * from tablet width (md). Status is carried by text and icon in PathNode, not colour alone.
 */
export function PathMap({ stages, stageHref, className }: PathMapProps) {
  return (
    <ol
      aria-label="Peta tahap belajar"
      className={cn("flex flex-col gap-2 md:grid md:grid-cols-3 md:gap-3", className)}
    >
      {stages.map((stage, index) => {
        const next = stages[index + 1];
        return (
          <li
            key={stage.number}
            aria-current={stage.status === "active" ? "step" : undefined}
            className="relative"
          >
            {next && (
              // Connector from this node's centre to the next one; the circles paint over its ends.
              <span
                aria-hidden
                className={cn(
                  "absolute top-1/2 left-9 h-[calc(100%+0.5rem)] w-0.5 -translate-x-1/2 md:hidden",
                  stage.status === "mastered" && next.status !== "locked"
                    ? "bg-success"
                    : "bg-border",
                )}
              />
            )}
            <PathNode
              {...stage}
              href={stageHref?.(stage)}
              className={cn(
                "md:h-full md:border md:bg-card md:p-4 md:text-card-foreground",
                stage.status === "active" && "md:border-primary md:ring-1 md:ring-primary",
              )}
            />
          </li>
        );
      })}
    </ol>
  );
}
