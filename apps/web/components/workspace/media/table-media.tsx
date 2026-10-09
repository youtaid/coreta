"use client";

import type { WorkspaceMedia } from "@/lib/domain";
import { cn } from "@/lib/utils";

import { MathFormula } from "./math-formula";

export interface TableMediaProps {
  media: WorkspaceMedia;
  className?: string;
}

/**
 * Checks if a string contains mathematical syntax to be rendered by KaTeX.
 */
function isMathExpression(text: string): boolean {
  return (
    text.includes("$") ||
    text.includes("\\") ||
    text.includes("^") ||
    text.includes("_") ||
    text.includes("\\frac") ||
    text.includes("\\sqrt") ||
    text.includes("\\pm") ||
    text.includes("\\le") ||
    text.includes("\\ge") ||
    text.includes("\\times")
  );
}

/**
 * TableMedia renders structured tabular data with responsive internal horizontal scrolling
 * and integrated KaTeX formula rendering inside cells.
 */
export function TableMedia({ media, className }: TableMediaProps) {
  const tableData = media.tableData;

  if (!tableData) {
    return (
      <div className="flex h-full min-h-[160px] items-center justify-center p-6 text-sm text-muted-foreground">
        Data tabel tidak tersedia.
      </div>
    );
  }

  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden", className)}>
      {/* Table Scrollable Container: Internal scroll only, never window scroll */}
      <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-4">
        <div className="inline-block min-w-full align-middle rounded-lg border border-border/80 shadow-2xs overflow-hidden bg-card">
          <table className="min-w-full divide-y divide-border/80 text-left text-xs sm:text-sm">
            <caption className="sr-only">{media.altText || media.title || "Tabel data"}</caption>
            <thead className="bg-muted/60 text-foreground font-semibold">
              <tr>
                {tableData.headers.map((header, idx) => (
                  <th
                    key={`th-${idx}`}
                    scope="col"
                    className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-bold tracking-wide uppercase first:pl-4 last:pr-4"
                  >
                    {isMathExpression(header) ? (
                      <MathFormula formula={header.replace(/\$/g, "")} inline />
                    ) : (
                      header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-card">
              {tableData.rows.map((row, rowIdx) => (
                <tr
                  key={`tr-${rowIdx}`}
                  className="transition-colors hover:bg-muted/30 even:bg-muted/15"
                >
                  {row.map((cell, colIdx) => (
                    <td
                      key={`td-${rowIdx}-${colIdx}`}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap text-foreground first:pl-4 last:pr-4 font-medium"
                    >
                      {isMathExpression(cell) ? (
                        <MathFormula formula={cell.replace(/\$/g, "")} inline />
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tableData.footnote && (
          <p className="mt-2 text-[11px] text-muted-foreground italic">
            * Catatan: {tableData.footnote}
          </p>
        )}
      </div>
    </div>
  );
}
