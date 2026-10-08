import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Bantuan — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Belajar"
      title="Bantuan"
      description="Asisten layanan dan FAQ perangkat."
      phase={14}
      links={[{ label: "Jalur belajar", href: "/belajar" }]}
    />
  );
}
