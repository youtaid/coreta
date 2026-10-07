"use client";

import { Inbox } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/domain/empty-state";
import { SlaCountdown } from "@/components/domain/sla-countdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import type { HintReport, HintReportReason, HintReportStatus } from "@/lib/domain";
import { countByStatus, hintReportStatusLabels, sortReviewQueue } from "@/lib/sla";
import { cn } from "@/lib/utils";

type Filter = "all" | HintReportStatus;

interface ReviewQueueProps {
  reports: readonly HintReport[];
  reasonLabels: Readonly<Record<HintReportReason, string>>;
}

const statusVariant: Record<HintReportStatus, "warning" | "success" | "secondary" | "destructive"> =
  {
    open: "warning",
    valid: "success",
    revised: "secondary",
    item_flagged: "destructive",
  };

// Decisions a reviewer can take on an open report.
const decisions: { status: Exclude<HintReportStatus, "open">; label: string }[] = [
  { status: "valid", label: "Petunjuk valid" },
  { status: "revised", label: "Petunjuk direvisi" },
  { status: "item_flagged", label: "Tandai butir" },
];

/** Hint-report queue with status filters and a review dialog. Decisions only change local state. */
export function ReviewQueue({ reports: initialReports, reasonLabels }: ReviewQueueProps) {
  const [reports, setReports] = useState<HintReport[]>(() => [...initialReports]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = countByStatus(reports);
  const sorted = sortReviewQueue(reports);
  const visible = filter === "all" ? sorted : sorted.filter((report) => report.status === filter);
  const selected = reports.find((report) => report.id === selectedId) ?? null;

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "Semua", count: reports.length },
    ...(Object.keys(hintReportStatusLabels) as HintReportStatus[]).map((status) => ({
      value: status,
      label: hintReportStatusLabels[status],
      count: counts[status],
    })),
  ];

  function decide(status: HintReportStatus) {
    if (!selected) return;
    setReports((current) =>
      current.map((report) => (report.id === selected.id ? { ...report, status } : report)),
    );
    setSelectedId(null);
    toast.add({
      type: "success",
      title: `Laporan ${selected.reporterLabel} ditandai "${hintReportStatusLabels[status]}"`,
      description: "Perubahan hanya tampil di layar ini dan belum tersimpan.",
    });
  }

  return (
    <div className="space-y-5">
      <div role="group" aria-label="Filter status laporan" className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={cn(
              "inline-flex min-h-touch items-center gap-2 rounded-lg border px-3 font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring",
              filter === item.value
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent",
            )}
          >
            {item.label}
            <span className="tabular-nums opacity-80">{item.count}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Tidak ada laporan"
          description="Tidak ada laporan dengan status ini."
        />
      ) : (
        <ul className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
          {visible.map((report) => (
            <li
              key={report.id}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4"
            >
              <div className="min-w-0 space-y-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold tabular-nums">{report.itemCode}</span>
                  <Badge variant={statusVariant[report.status]}>
                    {hintReportStatusLabels[report.status]}
                  </Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  {reasonLabels[report.reason]} · {report.reporterLabel} · {report.reportedLabel}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {report.status === "open" && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Batas tinjau</p>
                    <SlaCountdown dueInMinutes={report.dueInMinutes} />
                  </div>
                )}
                <Button
                  variant={report.status === "open" ? "default" : "outline"}
                  onClick={() => setSelectedId(report.id)}
                >
                  Tinjau
                  <span className="sr-only"> laporan {report.itemCode}</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Tinjau laporan {selected.itemCode}</DialogTitle>
                <DialogDescription>
                  {selected.competencyName} · {selected.reporterLabel} · {selected.reportedLabel}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <p>
                  <Badge variant="outline">{reasonLabels[selected.reason]}</Badge>
                </p>
                <div>
                  <p className="text-sm text-muted-foreground">Petunjuk yang ditampilkan</p>
                  <blockquote className="mt-1 rounded-lg bg-muted px-3 py-2">
                    {selected.hintText}
                  </blockquote>
                </div>
                {selected.status === "open" && (
                  <p className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Batas tinjau:</span>
                    <SlaCountdown dueInMinutes={selected.dueInMinutes} />
                  </p>
                )}
                <Link
                  href={`/admin/konten/butir/${selected.itemId}`}
                  className="inline-flex min-h-touch items-center text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
                >
                  Buka editor butir
                </Link>
              </div>

              <DialogFooter className="flex-wrap">
                <DialogClose render={<Button variant="outline" />}>Tutup</DialogClose>
                {decisions.map((decision) => (
                  <Button
                    key={decision.status}
                    variant={decision.status === "item_flagged" ? "destructive" : "default"}
                    disabled={selected.status === decision.status}
                    onClick={() => decide(decision.status)}
                  >
                    {decision.label}
                  </Button>
                ))}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
