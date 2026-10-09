import { PageHeader } from "@/components/domain/page-header";
import { ReleaseList } from "@/components/domain/release-list";
import { adminWorksheets } from "@/lib/mock/content";

export default function ReleasesPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Rilis worksheet"
        description="Worksheet mingguan terdiri dari 8 soal: 4 baru, 2 adaptif, dan 2 ulang berjarak. Worksheet baru bisa diterbitkan setelah semua slot penuh dan semua butirnya terbit."
      />
      <ReleaseList worksheets={adminWorksheets} />
    </section>
  );
}
