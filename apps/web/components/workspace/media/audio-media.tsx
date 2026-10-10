"use client";

import {
  ChevronDown,
  ChevronUp,
  FileText,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { WorkspaceMedia } from "@/lib/domain";
import { cn } from "@/lib/utils";

export interface AudioMediaProps {
  media: WorkspaceMedia;
  className?: string;
}

function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * AudioMedia provides an accessible, touch-friendly HTML5 audio player
 * with progress scrubber, time counter, and collapsible full text transcript.
 */
export function AudioMedia({ media, className }: AudioMediaProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(85); // Default mock fallback 1m25s
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Fallback toggle for mock environments without actual audio decode
          setIsPlaying((prev) => !prev);
        });
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !isMuted;
    }
    setIsMuted((prev) => !prev);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setCurrentTime(0);
  };

  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden", className)}>
      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={media.url || "/sample-audio.mp3"}
        preload="metadata"
        aria-label={media.altText}
      />

      {/* Audio Player Card */}
      <div className="p-4 sm:p-5 flex flex-col gap-4 border-b border-border/70 bg-card">
        {/* Speaker / Title Meta */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-heading text-sm font-bold text-foreground truncate">
              {media.title || "Stimulus Rekaman Audio"}
            </h4>
            {media.audioSpeaker && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Narasumber:{" "}
                <span className="font-semibold text-foreground">{media.audioSpeaker}</span>
              </p>
            )}
          </div>
          <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {media.durationLabel || formatAudioTime(duration)}
          </span>
        </div>

        {/* Scrubber & Timers */}
        <div className="space-y-1.5">
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              aria-label="Posisi pemutaran audio"
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatAudioTime(duration)}</span>
          </div>
        </div>

        {/* Player Controls (Touch target >= 44px) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              onClick={togglePlay}
              aria-label={isPlaying ? "Jeda pemutaran audio" : "Putar audio"}
              className="min-h-touch min-w-touch rounded-full px-4 gap-2 font-bold shadow-xs cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="size-4" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="size-4" />
                  <span>Putar</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRestart}
              aria-label="Ulangi dari awal"
              className="min-h-touch min-w-touch rounded-full text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              aria-label={isMuted ? "Bunyikan suara" : "Senyapkan suara"}
              className="min-h-touch min-w-touch rounded-full text-muted-foreground hover:text-foreground"
            >
              {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </Button>
          </div>

          {/* Transcript Toggle Button */}
          {media.transcript && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowTranscript((prev) => !prev)}
              aria-expanded={showTranscript}
              aria-label="Buka transkrip audio"
              className="min-h-touch gap-1.5 px-3 font-semibold text-xs rounded-lg"
            >
              <FileText className="size-3.5" />
              <span>Transkrip</span>
              {showTranscript ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Transcript Area: Collapsible with Internal Scroll Only */}
      {media.transcript && showTranscript && (
        <div className="flex-1 min-h-0 overflow-auto p-4 bg-muted/20 animate-in fade-in duration-150">
          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/60">
              <FileText className="size-4 text-primary" />
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Transkrip Lengkap Teks
              </h5>
            </div>
            <div className="text-xs leading-relaxed text-foreground whitespace-pre-line font-normal">
              {media.transcript}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
