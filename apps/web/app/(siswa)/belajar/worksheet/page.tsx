import { BookOpenCheck } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/domain/empty-state";
import { PageHeader } from "@/components/domain/page-header";
import { WorksheetCard } from "@/components/domain/worksheet-card";
import { worksheets } from "@/lib/mock/learning";
import {
  STAGE_PARAM,
  filterByStage,
  groupWorksheets,
  parseStageFilter,
  stageFilterHref,
  stageFilterOptions,
  worksheetHref,
} from "@/lib/mock/worksheets";
import { cn } from "@/lib/utils";

export default async function WorksheetListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const selected = parseStageFilter((await searchParams)[STAGE_PARAM]);
  const groups = groupWorksheets(filterByStage(worksheets, selected));
  const options = stageFilterOptions(worksheets, selected);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Siswa"
        title="Daftar worksheet"
        description="Kerjakan worksheet minggu ini, ulangi soal lama, atau lihat hasil yang sudah selesai."
      />

      <nav aria-label="Filter tahap" className="flex flex-wrap gap-2">
        {[null, ...options].map((stage) => {
          const active = stage === selected;
          return (
            <Link
              key={stage ?? "semua"}
              href={stageFilterHref(stage)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-touch items-center rounded-full border px-4 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {stage === null ? "Semua tahap" : `Tahap ${stage}`}
            </Link>
          );
        })}
      </nav>

      {groups.length === 0 && (
        <EmptyState
          icon={BookOpenCheck}
          // Non-breaking space keeps "Tahap 0" together when the title wraps.
          title={`Belum ada worksheet untuk Tahap\u00a0${selected}`}
          description="Worksheet tahap ini belum terbit atau sudah lewat. Lihat semua worksheet untuk melanjutkan."
          action={{ label: "Lihat semua worksheet", href: stageFilterHref(null) }}
        />
      )}

      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`grup-${group.key}`} className="space-y-4">
          <div className="space-y-1">
            <h2 id={`grup-${group.key}`} className="font-heading text-xl font-semibold">
              {group.title}
            </h2>
            <p className="text-muted-foreground">{group.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((worksheet) => (
              <WorksheetCard key={worksheet.id} {...worksheet} href={worksheetHref(worksheet)} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
