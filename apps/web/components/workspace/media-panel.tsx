"use client";

import { ClipboardPaste, FileSpreadsheet, Headphones, ImageIcon, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkspaceMedia } from "@/lib/domain";
import { cn } from "@/lib/utils";

import { AudioMedia } from "./media/audio-media";
import { ImageMedia } from "./media/image-media";
import { TableMedia } from "./media/table-media";
import { VideoMedia } from "./media/video-media";

export interface MediaPanelProps {
  media: WorkspaceMedia;
  className?: string;
  /** Pastes this media onto the scratch area; the button shows only for pasteable media. */
  onPaste?: () => void;
  /** Number of copies already pasted, shown on the button. */
  pastedCount?: number;
}

const mediaMeta: Record<
  WorkspaceMedia["kind"],
  {
    label: string;
    badgeDetail?: string;
    icon: typeof ImageIcon;
    badgeVariant: "default" | "secondary" | "outline";
  }
> = {
  diagram: {
    label: "Diagram Vektor",
    badgeDetail: "Vektor HD",
    icon: ImageIcon,
    badgeVariant: "secondary",
  },
  image: {
    label: "Gambar Stimulus",
    badgeDetail: "Resolusi HD",
    icon: ImageIcon,
    badgeVariant: "secondary",
  },
  table: { label: "Tabel Data", icon: FileSpreadsheet, badgeVariant: "outline" },
  audio: { label: "Audio Stimulus", icon: Headphones, badgeVariant: "default" },
  video: { label: "Video Simulasi", icon: Video, badgeVariant: "default" },
};

/**
 * MediaPanel is the central workspace stimulus renderer for Fase 12.
 * Supports zoomable images/diagrams, structured KaTeX tables, HTML5 audio with transcripts,
 * and MP4 video with interactive closed-captions.
 *
 * Guarantees single-screen fit (Rule 9: never scrolls the outer workspace).
 */
export function MediaPanel({ media, className, onPaste, pastedCount = 0 }: MediaPanelProps) {
  const meta = mediaMeta[media.kind] || mediaMeta.image;
  const KindIcon = meta.icon;

  return (
    <figure
      aria-label={media.title || media.altText}
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs",
        className,
      )}
    >
      {/* 1. Header Bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-border/70 bg-muted/40 px-3 py-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <KindIcon className="size-4 shrink-0 text-primary" />
          <span className="font-heading truncate font-bold text-foreground">
            {media.title || "Stimulus Soal"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {media.pasteable && onPaste && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPaste}
              aria-label={`Tempel ${media.title || "media"} ke area coretan`}
              className="gap-1 px-2 text-xs"
            >
              <ClipboardPaste aria-hidden data-icon="inline-start" />
              Tempel
              {pastedCount > 0 && (
                <span className="tabular-nums text-muted-foreground">({pastedCount})</span>
              )}
            </Button>
          )}
          <Badge
            variant={meta.badgeVariant}
            className="h-5 px-1.5 text-[10px] font-semibold tracking-wide uppercase"
          >
            {meta.badgeDetail || meta.label}
          </Badge>
        </div>
      </header>

      {/* 2. Media Content Canvas */}
      <div className="flex-1 min-h-0 w-full overflow-hidden bg-background">
        {media.kind === "table" ? (
          <TableMedia media={media} />
        ) : media.kind === "audio" ? (
          <AudioMedia media={media} />
        ) : media.kind === "video" ? (
          <VideoMedia media={media} />
        ) : (
          <ImageMedia media={media} />
        )}
      </div>

      {/* 3. Caption / Alt Text Footer */}
      {(media.caption || media.altText) && (
        <figcaption className="shrink-0 border-t border-border/60 bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground flex items-center justify-between gap-2">
          <span className="truncate">{media.caption || media.altText}</span>
          <span className="text-[10px] font-medium text-muted-foreground/80 shrink-0">
            Aksesibel
          </span>
        </figcaption>
      )}
    </figure>
  );
}
