import { PageHeader } from "@/components/domain/page-header";
import { WorksheetCard } from "@/components/domain/worksheet-card";
import { worksheets } from "@/lib/mock/learning";
import { groupWorksheets, worksheetHref } from "@/lib/mock/worksheets";

export default function WorksheetListPage() {
  const groups = groupWorksheets(worksheets);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Siswa"
        title="Daftar worksheet"
        description="Kerjakan worksheet minggu ini, ulangi soal lama, atau lihat hasil yang sudah selesai."
      />

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
