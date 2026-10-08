import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Antrean Tinjauan — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Admin"
      title="Antrean Tinjauan"
      description="Laporan petunjuk dengan batas 24 jam."
      phase={17}
      links={[{ label: "Buka editor butir contoh", href: "/admin/konten/butir/item-mock-001" }]}
    />
  );
}
