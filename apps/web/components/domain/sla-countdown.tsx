"use client";

import { AlarmClock } from "lucide-react";

import { clockStart, useNow } from "@/lib/use-clock";
import { describeRemaining, formatCountdown, slaLevel } from "@/lib/sla";
import { cn } from "@/lib/utils";

interface SlaCountdownProps {
  /** Minutes left until the deadline, measured when the page loaded. */
  dueInMinutes: number;
  className?: string;
}

/** Live countdown to a review deadline; red under 4 hours left, and "Terlambat" once it passes. */
export function SlaCountdown({ dueInMinutes, className }: SlaCountdownProps) {
  const now = useNow();

  // Server and first client render agree on this placeholder; the clock starts after hydration.
  if (now === null) {
    return (
      <span className={cn("text-muted-foreground tabular-nums", className)} aria-hidden>
        --:--:--
      </span>
    );
  }

  const remaining = clockStart + dueInMinutes * 60_000 - now;
  const level = slaLevel(remaining);

  return (
    <span
      role="timer"
      aria-label={describeRemaining(remaining)}
      data-level={level}
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold tabular-nums",
        level === "ok" && "text-foreground",
        level !== "ok" && "text-destructive",
        className,
      )}
    >
      {level !== "ok" && <AlarmClock className="size-4" aria-hidden />}
      <span aria-hidden>
        {level === "overdue" && "Terlambat "}
        {formatCountdown(remaining)}
      </span>
    </span>
  );
}
