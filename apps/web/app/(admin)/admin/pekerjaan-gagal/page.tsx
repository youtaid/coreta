import { CheckCircle2 } from "lucide-react";

import { EmptyState } from "@/components/domain/empty-state";
import { FailedJobsList } from "@/components/domain/failed-jobs-list";
import { PageHeader } from "@/components/domain/page-header";
import { failedJobs } from "@/lib/mock/admin";

export default function FailedJobsPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Pekerjaan gagal"
        description="Pekerjaan latar belakang yang gagal beserta penyebabnya. Coba ulang setelah penyebabnya diperbaiki."
      />
      {failedJobs.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Tidak ada pekerjaan gagal"
          description="Semua pekerjaan berjalan normal."
        />
      ) : (
        <FailedJobsList jobs={failedJobs} />
      )}
    </section>
  );
}
