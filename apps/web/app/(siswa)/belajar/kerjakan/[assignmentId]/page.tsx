import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Ruang Kerja — Coreta",
};

export default async function Page({ params }: PageProps<"/belajar/kerjakan/[assignmentId]">) {
  const { assignmentId } = await params;
  return (
    <PlaceholderPage
      eyebrow="Belajar"
      title="Ruang Kerja"
      description={`Mengerjakan worksheet ${assignmentId}.`}
      phase={10}
      links={[
        { label: "Lihat hasil", href: `/belajar/hasil/${assignmentId}` },
        { label: "Kembali ke worksheet", href: "/belajar/worksheet" },
      ]}
    />
  );
}
