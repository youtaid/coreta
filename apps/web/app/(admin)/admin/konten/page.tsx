import { Upload } from "lucide-react";

import { ContentTable } from "@/components/domain/content-table";
import { NotConnectedButton } from "@/components/domain/not-connected-button";
import { PageHeader } from "@/components/domain/page-header";
import { adminItems } from "@/lib/mock/content";

export default function ContentListPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Daftar butir soal"
        description="Semua butir beserta statusnya. Butir yang terlalu mudah, terlalu sulit, atau sering dilaporkan ditandai merah."
        actions={
          <NotConnectedButton
            variant="outline"
            description="Impor butir dihubungkan setelah database siap."
          >
            <Upload aria-hidden data-icon="inline-start" />
            Impor butir
          </NotConnectedButton>
        }
      />
      <ContentTable items={adminItems} />
    </section>
  );
}
