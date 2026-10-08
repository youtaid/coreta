import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Hasil Worksheet — Coreta",
};

export default async function Page({ params }: PageProps<"/belajar/hasil/[assignmentId]">) {
  const { assignmentId } = await params;
  return (
    <PlaceholderPage
      eyebrow="Belajar"
      title="Hasil Worksheet"
      description={`Hasil worksheet ${assignmentId}.`}
      phase={9}
      links={[
        { label: "Progres", href: "/belajar/progres" },
        { label: "Jalur belajar", href: "/belajar" },
      ]}
    />
  );
}
