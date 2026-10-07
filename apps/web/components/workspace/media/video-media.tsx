"use client";

import {
  MessageSquareText,
  Pause,
  Play,
  RotateCcw,
  Subtitles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { MediaCaptionCue, WorkspaceMedia } from "@/lib/domain";
import { cn } from "@/lib/utils";

export interface VideoMediaProps {
  media: WorkspaceMedia;
  className?: string;
}

function formatVideoTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * VideoMedia provides an accessible MP4 video player with synchronized
 * Indonesian closed-captions (takarir), custom touch-friendly controls,
 * and an optional captions inspector.
 */
export function VideoMedia({ media, className }: VideoMediaProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(90); // Default mock fallback 1m30s
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showCueList, setShowCueList] = useState(false);

  const captions: MediaCaptionCue[] = media.captions || [
    { start: 0, end: 5, text: "Selamat datang pada simulasi gerak parabola terapan." },
    { start: 5, end: 12, text: "Perhatikan sudut elevasi awal theta sebesar 45 derajat." },
    {
      start: 12,
      end: 20,
      text: "Kecepatan awal v0 menghasilkan komponen horizontal vx tetap konstan.",
    },
    {
      start: 20,
      end: 30,
      text: "Di titik tertinggi, komponen kecepatan vertikal vy sama dengan nol.",
    },
  ];

  // Find active caption based on current time
  const activeCaption = captions.find((c) => currentTime >= c.start && currentTime <= c.end);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying((prev) => !prev);
        });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
    }
    setIsMuted((prev) => !prev);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    setCurrentTime(0);
  };

  const jumpToCue = (start: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = start;
    }
    setCurrentTime(start);
  };

  return (
    <div
      className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden bg-black/90", className)}
    >
      {/* Video Container with Overlaid Captions */}
      <div className="relative flex flex-1 min-h-[180px] w-full items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={media.url || "/sample-video.mp4"}
          poster={media.posterUrl}
          playsInline
          aria-label={media.altText}
          className="h-full w-full object-contain"
          onClick={togglePlay}
        >
          {media.captionTrackUrl && (
            <track
              kind="captions"
              src={media.captionTrackUrl}
              srcLang="id"
              label="Bahasa Indonesia"
              default
            />
          )}
        </video>

        {/* Big Center Play Button when paused */}
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Putar video"
            className="absolute flex size-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-xs transition-transform hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
          >
            <Play className="ml-1 size-7 fill-current" />
          </button>
        )}

        {/* Active Caption / Takarir Overlay (Synchronized with video timestamp) */}
        {showCaptions && activeCaption && (
          <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex justify-center">
            <span className="rounded-md bg-black/80 px-3 py-1.5 text-center text-xs sm:text-sm font-semibold text-white shadow-md backdrop-blur-xs">
              {activeCaption.text}
            </span>
          </div>
        )}
      </div>

      {/* Video Controls Bar */}
      <div className="shrink-0 flex flex-col gap-2 border-t border-border/40 bg-card p-3 sm:p-4 text-foreground">
        {/* Scrubber & Timers */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            aria-label="Posisi pemutaran video"
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary focus-visible:outline-2 focus-visible:outline-ring"
          />
          <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
            <span>{formatVideoTime(currentTime)}</span>
            <span>{formatVideoTime(duration)}</span>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={togglePlay}
              aria-label={isPlaying ? "Jeda video" : "Putar video"}
              className="min-h-touch min-w-touch rounded-lg font-bold shadow-xs cursor-pointer gap-1.5 px-3"
            >
              {isPlaying ? (
                <>
                  <Pause className="size-4" />
                  <span className="text-xs">Jeda</span>
                </>
              ) : (
                <>
                  <Play className="size-4" />
                  <span className="text-xs">Putar</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRestart}
              aria-label="Ulangi dari awal"
              className="min-h-touch min-w-touch rounded-lg text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              aria-label={isMuted ? "Bunyikan suara" : "Senyapkan suara"}
              className="min-h-touch min-w-touch rounded-lg text-muted-foreground hover:text-foreground"
            >
              {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle Takarir (CC) */}
            <Button
              type="button"
              variant={showCaptions ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowCaptions((prev) => !prev)}
              aria-label={showCaptions ? "Sembunyikan takarir" : "Tampilkan takarir"}
              className="min-h-touch gap-1 px-2.5 text-xs font-semibold rounded-lg"
            >
              <Subtitles className="size-3.5" />
              <span>CC</span>
            </Button>

            {/* Toggle Cue List / Transkrip Takarir */}
            <Button
              type="button"
              variant={showCueList ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowCueList((prev) => !prev)}
              aria-expanded={showCueList}
              aria-label="Daftar takarir lengkap"
              className="min-h-touch gap-1 px-2.5 text-xs font-semibold rounded-lg"
            >
              <MessageSquareText className="size-3.5" />
              <span className="hidden sm:inline">Daftar Takarir</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Collapsible Cue List (Interactive clickable cues) */}
      {showCueList && (
        <div className="max-h-36 overflow-auto border-t border-border/50 bg-muted/20 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Navigasi Takarir (Klik untuk loncat ke segmen):
          </p>
          <div className="space-y-1">
            {captions.map((cue, idx) => (
              <button
                key={`cue-${idx}`}
                type="button"
                onClick={() => jumpToCue(cue.start)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md p-1.5 text-left text-xs transition-colors hover:bg-muted cursor-pointer",
                  currentTime >= cue.start &&
                    currentTime <= cue.end &&
                    "bg-primary/10 font-medium text-primary",
                )}
              >
                <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5">
                  [{formatVideoTime(cue.start)}]
                </span>
                <span className="flex-1">{cue.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
