import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Jalur Belajar — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Belajar"
      title="Jalur Belajar"
      description="Peta Tahap 0–8, target harian, dan tombol lanjut belajar."
      phase={8}
      links={[
        { label: "Worksheet", href: "/belajar/worksheet" },
        { label: "Progres", href: "/belajar/progres" },
      ]}
    />
  );
}
