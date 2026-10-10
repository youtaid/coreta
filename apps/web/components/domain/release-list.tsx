import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { NotConnectedButton } from "@/components/domain/not-connected-button";
import { Badge } from "@/components/ui/badge";
import {
  WORKSHEET_SLOTS,
  worksheetBlockers,
  worksheetItemCount,
  slotNames,
} from "@/lib/admin-content";
import type { AdminWorksheet } from "@/lib/domain";

/** Weekly worksheets with their slot composition and what blocks a release. */
export function ReleaseList({ worksheets }: { worksheets: readonly AdminWorksheet[] }) {
  return (
    <ul className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
      {worksheets.map((worksheet) => {
        const blockers = worksheetBlockers(worksheet);
        const published = worksheet.status === "published";
        return (
          <li key={worksheet.id} className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <div className="min-w-0 space-y-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{worksheet.title}</span>
                  <Badge variant={published ? "success" : "secondary"}>
                    {published ? "Terbit" : "Draf"}
                  </Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  {worksheet.stageName} · rilis {worksheet.releaseLabel}
                </p>
                <p className="text-sm tabular-nums">
                  {worksheetItemCount(worksheet)} soal:{" "}
                  {(["new", "adaptive", "review"] as const).map((slot, index) => (
                    <span key={slot}>
                      {index > 0 && ", "}
                      {worksheet.slots[slot]} {slotNames[slot]}
                      <span className="text-muted-foreground"> / {WORKSHEET_SLOTS[slot]}</span>
                    </span>
                  ))}
                </p>
              </div>
              {!published && (
                <NotConnectedButton
                  disabled={blockers.length > 0}
                  description="Menerbitkan worksheet dihubungkan setelah database siap."
                >
                  Terbitkan
                  <span className="sr-only"> {worksheet.title}</span>
                </NotConnectedButton>
              )}
            </div>
            {!published &&
              (blockers.length === 0 ? (
                <p className="flex items-center gap-2 text-sm font-medium text-success">
                  <CheckCircle2 className="size-4" aria-hidden />
                  Siap diterbitkan
                </p>
              ) : (
                <ul className="space-y-1">
                  {blockers.map((blocker) => (
                    <li key={blocker} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
                      {blocker}
                    </li>
                  ))}
                </ul>
              ))}
          </li>
        );
      })}
    </ul>
  );
}
