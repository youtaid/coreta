import { MockChat } from "@/app/_chat/mock-chat";
import { PageHeader } from "@/components/domain/page-header";

export default function StudentHelpPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Siswa"
        title="Bantuan"
        description="Bingung cara memakai worksheet atau petunjuk? Tanya asisten Coreta."
      />
      <MockChat audience="siswa" />
    </section>
  );
}
