import { MockChat } from "@/app/_chat/mock-chat";
import { PageHeader } from "@/components/domain/page-header";

export default function ParentHelpPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Orang tua"
        title="Bantuan"
        description="Pertanyaan soal laporan, langganan, atau akun anak? Tanya asisten Coreta."
      />
      <MockChat audience="ortu" />
    </section>
  );
}
