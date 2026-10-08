import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Progres — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Belajar"
      title="Progres"
      description="Kemajuan per kompetensi dengan garis ambang 80% dan kalender aktivitas."
      phase={14}
      links={[{ label: "Worksheet", href: "/belajar/worksheet" }]}
    />
  );
}
