import type { WorkspaceMedia } from "@/lib/domain";

import { MediaPanel } from "./media-panel";

export interface MediaViewProps {
  media: WorkspaceMedia;
  className?: string;
  onPaste?: () => void;
  pastedCount?: number;
}

/**
 * MediaView displays the question diagram/media in mode media.
 * Delegates to MediaPanel to handle diagrams, images, tables, audio, and video.
 */
export function MediaView({ media, className, onPaste, pastedCount }: MediaViewProps) {
  return (
    <MediaPanel media={media} className={className} onPaste={onPaste} pastedCount={pastedCount} />
  );
}
