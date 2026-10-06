import { Check, Lock } from "lucide-react";
import Link from "next/link";

import type { Stage, StageStatus } from "@/lib/domain";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type PathNodeProps = Stage & {
  /** Destination when the stage is open; locked stages are never links. */
  href?: string;
  className?: string;
};

const statusLabel: Record<StageStatus, string> = {
  locked: "Terkunci",
  active: "Sedang dipelajari",
  mastered: "Tuntas",
};

export function PathNode({ number, name, status, progress, href, className }: PathNodeProps) {
  const content = (
    <>
      <span
        className={cn(
          "relative grid size-14 shrink-0 place-items-center rounded-full border-2 text-xl font-bold",
          status === "mastered" && "border-success bg-success text-success-foreground",
          status === "active" && "border-primary bg-primary text-primary-foreground",
          status === "locked" && "border-border bg-muted text-muted-foreground",
        )}
      >
        {status === "mastered" ? (
          <Check className="size-7" aria-hidden />
        ) : status === "locked" ? (
          <Lock className="size-6" aria-hidden />
        ) : (
          number
        )}
        {status === "active" && (
          <span
            className="absolute -inset-1.5 animate-pulse rounded-full border-2 border-primary/40"
            aria-hidden
          />
        )}
      </span>
      <span className="min-w-0 space-y-0.5 text-left">
        <span className="block text-sm text-muted-foreground">Tahap {number}</span>
        <span className={cn("block font-semibold", status === "locked" && "text-muted-foreground")}>
          {name}
        </span>
        <span
          className={cn(
            "block text-sm",
            status === "mastered" && "text-success",
            status === "active" && "text-primary",
            status === "locked" && "text-muted-foreground",
          )}
        >
          {statusLabel[status]}
          {status === "active" && ` · ${formatPercent(progress)}`}
        </span>
      </span>
    </>
  );

  const base = "flex min-h-touch items-center gap-4 rounded-xl p-2";

  if (href && status !== "locked") {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring",
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn(base, className)} aria-disabled={status === "locked" || undefined}>
      {content}
    </div>
  );
}
