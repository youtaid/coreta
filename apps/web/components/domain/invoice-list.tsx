"use client";

import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { Invoice, InvoiceStatus } from "@/lib/domain";
import { formatRupiah } from "@/lib/format";

const statusMeta: Record<
  InvoiceStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "outline" }
> = {
  paid: { label: "Dibayar", variant: "success" },
  pending: { label: "Menunggu pembayaran", variant: "warning" },
  failed: { label: "Gagal", variant: "destructive" },
  refunded: { label: "Dikembalikan", variant: "outline" },
};

// A PDF only exists once money has moved, in either direction.
const hasPdf: Record<InvoiceStatus, boolean> = {
  paid: true,
  refunded: true,
  pending: false,
  failed: false,
};

/** Invoices as rows that wrap on narrow screens. The download button does nothing yet. */
export function InvoiceList({ invoices }: { invoices: readonly Invoice[] }) {
  return (
    <ul className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
      {invoices.map((invoice) => {
        const meta = statusMeta[invoice.status];
        return (
          <li
            key={invoice.id}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4"
          >
            <div className="min-w-0 space-y-0.5">
              <p className="font-semibold tabular-nums">{invoice.number}</p>
              <p className="text-sm text-muted-foreground">
                {invoice.dateLabel} · {invoice.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-semibold tabular-nums">{formatRupiah(invoice.amount)}</p>
              <Badge variant={meta.variant}>{meta.label}</Badge>
              {hasPdf[invoice.status] && (
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Unduh PDF ${invoice.number}`}
                  onClick={() =>
                    toast.add({
                      type: "info",
                      title: "Belum berfungsi",
                      description: "Unduh PDF dihubungkan setelah sistem faktur siap.",
                    })
                  }
                >
                  <Download aria-hidden data-icon="inline-start" />
                  Unduh PDF
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
