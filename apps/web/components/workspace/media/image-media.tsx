"use client";

import { Maximize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { WorkspaceMedia } from "@/lib/domain";
import { cn } from "@/lib/utils";

export interface ImageMediaProps {
  media: WorkspaceMedia;
  className?: string;
}

/**
 * DiagramCartesianParabola renders a crisp, vector SVG coordinate graph for math questions.
 */
export function DiagramCartesianParabola() {
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

        <rect
          x="-70"
          y="-110"
          width="340"
          height="240"
          fill="url(#cartesian-grid)"
          className="rounded-lg"
        />

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
        <polygon points="27,-100 30,-107 33,-100" className="fill-foreground/70" />
        <text x="36" y="-98" fontSize="11" fontWeight="600" className="fill-foreground/80">
          Y
        </text>

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

        <text x="22" y="73" fontSize="9" textAnchor="end" className="fill-muted-foreground">
          0
        </text>

        {/* Parabola: y = x^2 - 4x + 3 */}
        <path
          d="M 15 -75 Q 90 255 165 -75"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-primary"
        />

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

        <circle cx="60" cy="60" r="4" className="fill-primary" />
        <circle cx="120" cy="60" r="4" className="fill-primary" />
        <circle cx="30" cy="-30" r="4" className="fill-primary" />
      </svg>
    </div>
  );
}

/**
 * ImageMedia renders diagrams or raster images with interactive zoom controls
 * and a full-size modal dialog.
 */
export function ImageMedia({ media, className }: ImageMediaProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const isDiagram = media.kind === "diagram" || !media.url;

  return (
    <div className={cn("relative flex h-full min-h-0 w-full flex-col overflow-hidden", className)}>
      {/* Zoom Control Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-1.5 text-xs">
        <span className="text-[11px] font-medium text-muted-foreground">
          Skala: <strong className="text-foreground">{Math.round(zoomLevel * 100)}%</strong>
        </span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.75}
            aria-label="Perkecil gambar"
            className="h-8 w-8 min-h-touch min-w-touch p-0 text-muted-foreground hover:text-foreground"
          >
            <ZoomOut className="size-4" />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleResetZoom}
            disabled={zoomLevel === 1}
            aria-label="Atur ulang ukuran gambar"
            className="h-8 px-2 min-h-touch text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1 size-3" />
            100%
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2.5}
            aria-label="Perbesar gambar"
            className="h-8 w-8 min-h-touch min-w-touch p-0 text-muted-foreground hover:text-foreground"
          >
            <ZoomIn className="size-4" />
          </Button>

          <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
            <DialogTrigger
              render={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Buka gambar di layar penuh"
                  className="h-8 gap-1.5 px-2.5 min-h-touch text-xs font-semibold"
                />
              }
            >
              <Maximize2 className="size-3.5" />
              <span className="hidden sm:inline">Layar Penuh</span>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">
                  {media.title || "Tampilan Gambar Resolusi Penuh"}
                </DialogTitle>
              </DialogHeader>
              <div className="relative flex flex-1 min-h-[300px] max-h-[70vh] items-center justify-center overflow-auto rounded-lg bg-muted/20 p-4">
                {isDiagram ? (
                  <div className="w-full max-w-2xl">
                    <DiagramCartesianParabola />
                  </div>
                ) : (
                  <div className="relative h-full w-full max-h-[60vh] flex items-center justify-center">
                    <Image
                      src={media.url || "/images/coreta-horizontal-warna.png"}
                      alt={media.altText}
                      width={1200}
                      height={800}
                      className="max-h-full max-w-full object-contain rounded-md"
                    />
                  </div>
                )}
              </div>
              {media.caption && (
                <p className="mt-2 text-xs text-muted-foreground italic text-center">
                  {media.caption}
                </p>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Image View Container (Internal Scroll When Zoomed In) */}
      <div className="relative flex flex-1 min-h-0 w-full items-center justify-center overflow-auto p-4 bg-muted/10">
        <div
          className="transition-transform duration-150 ease-out origin-center flex items-center justify-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {isDiagram ? (
            <div className="w-[340px] sm:w-[400px]">
              <DiagramCartesianParabola />
            </div>
          ) : (
            <div className="relative max-w-full">
              <Image
                src={media.url || "/images/coreta-horizontal-warna.png"}
                alt={media.altText}
                width={800}
                height={500}
                className="max-h-[360px] w-auto object-contain rounded-lg shadow-2xs border border-border/40"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
