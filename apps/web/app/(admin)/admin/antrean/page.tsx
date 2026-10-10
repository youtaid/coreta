import { PageHeader } from "@/components/domain/page-header";
import { ReviewQueue } from "@/components/domain/review-queue";
import { hintReportReasonLabels, hintReports } from "@/lib/mock/admin";
import { SLA_HOURS, URGENT_BELOW_HOURS } from "@/lib/sla";

export default function ReviewQueuePage() {
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Antrean tinjauan"
        description={`Laporan petunjuk dari siswa. Setiap laporan harus ditinjau dalam ${SLA_HOURS} jam; hitung mundur menjadi merah saat sisa waktu kurang dari ${URGENT_BELOW_HOURS} jam.`}
      />
      <ReviewQueue reports={hintReports} reasonLabels={hintReportReasonLabels} />
    </section>
  );
}
