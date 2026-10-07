import { ExternalLink, ImageIcon } from "lucide-react";

import type { WorkspaceMedia } from "@/lib/domain";
import { cn } from "@/lib/utils";

export interface MediaViewProps {
  media: WorkspaceMedia;
  className?: string;
}

/**
 * DiagramCartesianParabola renders a crisp, vector SVG coordinate graph for math questions.
 * Fits within the workspace panel without overflow.
 */
function DiagramCartesianParabola() {
  return (
    <div className="relative flex h-full min-h-[160px] w-full items-center justify-center p-2">
      <svg
        viewBox="-80 -120 360 260"
        className="max-h-full max-w-full drop-shadow-xs select-none"
        aria-hidden="true"
      >
        <defs>
          <pattern id="cartesian-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path
              d="M 30 0 L 0 0 0 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-border/40"
            />
          </pattern>
        </defs>

        {/* Background grid */}
        <rect
          x="-70"
          y="-110"
          width="340"
          height="240"
          fill="url(#cartesian-grid)"
          className="rounded-lg"
        />

        {/* Origin / Coordinates:
            Origin (0,0) is at SVG coordinates (30, 60).
            Scale: 1 unit = 30px.
            SVG X = 30 + x * 30
            SVG Y = 60 - y * 30
        */}

        {/* X-axis */}
        <line
          x1="-60"
          y1="60"
          x2="250"
          y2="60"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-foreground/70"
        />
        {/* X-axis arrow */}
        <polygon points="250,57 257,60 250,63" className="fill-foreground/70" />
        <text x="252" y="74" fontSize="11" fontWeight="600" className="fill-foreground/80">
          X
        </text>

        {/* Y-axis */}
        <line
          x1="30"
          y1="120"
          x2="30"
          y2="-100"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-foreground/70"
        />
        {/* Y-axis arrow */}
        <polygon points="27,-100 30,-107 33,-100" className="fill-foreground/70" />
        <text x="36" y="-98" fontSize="11" fontWeight="600" className="fill-foreground/80">
          Y
        </text>

        {/* X-axis ticks & labels: -1, 1, 2, 3, 4, 5 */}
        {[-1, 1, 2, 3, 4, 5].map((x) => (
          <g key={`x-${x}`}>
            <line
              x1={30 + x * 30}
              y1="57"
              x2={30 + x * 30}
              y2="63"
              stroke="currentColor"
              strokeWidth="1"
              className="text-foreground/60"
            />
            <text
              x={30 + x * 30}
              y="74"
              fontSize="9"
              textAnchor="middle"
              className="fill-muted-foreground"
            >
              {x}
            </text>
          </g>
        ))}

        {/* Y-axis ticks & labels: -1, 1, 2, 3 */}
        {[-1, 1, 2, 3].map((y) => (
          <g key={`y-${y}`}>
            <line
              x1="27"
              y1={60 - y * 30}
              x2="33"
              y2={60 - y * 30}
              stroke="currentColor"
              strokeWidth="1"
              className="text-foreground/60"
            />
            <text
              x="22"
              y={63 - y * 30}
              fontSize="9"
              textAnchor="end"
              className="fill-muted-foreground"
            >
              {y}
            </text>
          </g>
        ))}

        {/* Origin label '0' */}
        <text x="22" y="73" fontSize="9" textAnchor="end" className="fill-muted-foreground">
          0
        </text>

        {/* Parabola Curve: y = x^2 - 4x + 3
            Points:
            x = -0.5 => y = 5.25
            x = 0    => y = 3 (SVG 30, -30)
            x = 1    => y = 0 (SVG 60, 60)
            x = 2    => y = -1 (SVG 90, 90) - vertex
            x = 3    => y = 0 (SVG 120, 60)
            x = 4    => y = 3 (SVG 150, -30)
            x = 4.5  => y = 5.25
        */}
        <path
          d="M 15 -75 Q 90 255 165 -75"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-primary"
        />

        {/* Key dots */}
        {/* Vertex (2, -1) -> SVG (90, 90) */}
        <circle cx="90" cy="90" r="4.5" className="fill-destructive" />
        <rect
          x="98"
          y="82"
          width="48"
          height="16"
          rx="3"
          className="fill-card stroke-border stroke-1"
        />
        <text x="102" y="94" fontSize="9" fontWeight="600" className="fill-destructive">
          P(2, -1)
        </text>

        {/* Roots: (1, 0) -> SVG (60, 60) and (3, 0) -> SVG (120, 60) */}
        <circle cx="60" cy="60" r="4" className="fill-primary" />
        <circle cx="120" cy="60" r="4" className="fill-primary" />

        {/* Y-intercept: (0, 3) -> SVG (30, -30) */}
        <circle cx="30" cy="-30" r="4" className="fill-primary" />
      </svg>
    </div>
  );
}

/**
 * MediaView displays the question diagram/media in mode media.
 * Designed to fit smoothly within the Workspace layout.
 */
export function MediaView({ media, className }: MediaViewProps) {
  return (
    <figure
      aria-label={media.title || media.altText}
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-muted/40 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <ImageIcon className="size-3.5 text-primary" />
          <span>{media.title || "Media Stimulus Soal"}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <span>Vektor HD</span>
          <ExternalLink className="size-3" />
        </span>
      </div>

      <div className="flex flex-1 min-h-0 items-center justify-center overflow-hidden bg-muted/10 p-2">
        <DiagramCartesianParabola />
      </div>

      {media.caption && (
        <figcaption className="shrink-0 border-t border-border/60 bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground">
          {media.caption}
        </figcaption>
      )}
    </figure>
  );
}
