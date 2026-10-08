import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Bantuan — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Orang tua"
      title="Bantuan"
      description="Asisten layanan tingkat 1 dan riwayat percakapan."
      phase={14}
      links={[{ label: "Laporan", href: "/ortu/laporan" }]}
    />
  );
}
