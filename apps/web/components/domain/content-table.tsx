"use client";

import { SearchX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/domain/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filterItems,
  type ItemFilter,
  itemHealth,
  itemHealthLabels,
  itemStatusLabels,
} from "@/lib/admin-content";
import type { AdminItem, AnswerType, ItemStatus, QuestionTier } from "@/lib/domain";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const tierLabels: Record<QuestionTier, string> = { dasar: "Dasar", mahir: "Mahir", ujian: "Ujian" };

const answerTypeLabels: Record<AnswerType, string> = {
  pg: "Pilihan ganda",
  pgk: "PG kompleks",
  bs: "Benar-salah",
  isian: "Isian singkat",
};

const statusVariant: Record<ItemStatus, "success" | "warning" | "secondary" | "outline"> = {
  published: "success",
  review: "warning",
  draft: "secondary",
  retired: "outline",
};

const selectClass =
  "h-touch rounded-lg border border-input bg-background px-3 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring";

/** Item list with search and filters. Items are only read; editing happens on the item page. */
export function ContentTable({ items }: { items: readonly AdminItem[] }) {
  const [filter, setFilter] = useState<ItemFilter>({
    query: "",
    status: "all",
    tier: "all",
    unhealthyOnly: false,
  });
  const visible = filterItems(items, filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid min-w-52 flex-1 gap-1 text-sm font-medium">
          Cari butir
          <Input
            type="search"
            value={filter.query}
            onChange={(event) => setFilter({ ...filter, query: event.target.value })}
            placeholder="Kode atau kompetensi"
            autoComplete="off"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Status
          <select
            className={selectClass}
            value={filter.status}
            onChange={(event) =>
              setFilter({ ...filter, status: event.target.value as ItemFilter["status"] })
            }
          >
            <option value="all">Semua</option>
            {(Object.keys(itemStatusLabels) as ItemStatus[]).map((status) => (
              <option key={status} value={status}>
                {itemStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Tingkat
          <select
            className={selectClass}
            value={filter.tier}
            onChange={(event) =>
              setFilter({ ...filter, tier: event.target.value as ItemFilter["tier"] })
            }
          >
            <option value="all">Semua</option>
            {(Object.keys(tierLabels) as QuestionTier[]).map((tier) => (
              <option key={tier} value={tier}>
                {tierLabels[tier]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          aria-pressed={filter.unhealthyOnly}
          onClick={() => setFilter({ ...filter, unhealthyOnly: !filter.unhealthyOnly })}
          className={cn(
            "inline-flex h-touch items-center rounded-lg border px-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring",
            filter.unhealthyOnly
              ? "border-primary bg-primary text-primary-foreground"
              : "hover:bg-accent",
          )}
        >
          Hanya yang bermasalah
        </button>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        Menampilkan {visible.length} dari {items.length} butir
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Tidak ada butir yang cocok"
          description="Ubah kata kunci atau filter untuk melihat butir lain."
        />
      ) : (
        <ul className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
          {visible.map((item) => {
            const health = itemHealth(item.stats);
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-4"
              >
                <div className="min-w-0 space-y-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold tabular-nums">{item.code}</span>
                    <Badge variant={statusVariant[item.status]}>
                      {itemStatusLabels[item.status]}
                    </Badge>
                    <Badge variant="outline">{tierLabels[item.tier]}</Badge>
                    {health.map((flag) => (
                      <Badge key={flag} variant="destructive">
                        {itemHealthLabels[flag]}
                      </Badge>
                    ))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.competencyCode} · {item.competencyName} ·{" "}
                    {answerTypeLabels[item.answerType]} · v{item.version}
                    {item.stats.attempts > 0 &&
                      ` · ${formatPercent(item.stats.correctRate)} benar dari ${item.stats.attempts} percobaan`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={`/admin/konten/butir/${item.id}`} />}
                >
                  Edit
                  <span className="sr-only"> butir {item.code}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
