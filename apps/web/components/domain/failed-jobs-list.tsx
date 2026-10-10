"use client";

import { RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { FailedJob } from "@/lib/domain";

/** Jobs in the failed queue. Retry does nothing yet; it only shows a notice. */
export function FailedJobsList({ jobs }: { jobs: readonly FailedJob[] }) {
  return (
    <ul className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
      {jobs.map((job) => (
        <li
          key={job.id}
          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4"
        >
          <div className="min-w-0 space-y-1">
            <p className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {job.queue}
              </Badge>
              <span className="font-semibold">{job.summary}</span>
            </p>
            <p className="text-sm break-words text-destructive">{job.error}</p>
            <p className="text-sm text-muted-foreground">
              Percobaan {job.attempts} dari {job.maxAttempts} · gagal {job.failedLabel} · {job.id}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              toast.add({
                type: "info",
                title: "Belum berfungsi",
                description: "Coba ulang dihubungkan setelah antrean pekerjaan siap.",
              })
            }
          >
            <RefreshCw aria-hidden data-icon="inline-start" />
            Coba ulang
            <span className="sr-only"> pekerjaan {job.id}</span>
          </Button>
        </li>
      ))}
    </ul>
  );
}
