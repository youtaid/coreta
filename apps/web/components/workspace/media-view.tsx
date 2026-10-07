import type { WorkspaceMedia } from "@/lib/domain";

import { MediaPanel } from "./media-panel";

export interface MediaViewProps {
  media: WorkspaceMedia;
  className?: string;
}

/**
 * MediaView displays the question diagram/media in mode media.
 * Delegates to MediaPanel to handle diagrams, images, tables, audio, and video.
 */
export function MediaView({ media, className }: MediaViewProps) {
  return <MediaPanel media={media} className={className} />;
}
