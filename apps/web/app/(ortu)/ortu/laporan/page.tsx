import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Laporan — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Orang tua"
      title="Laporan"
      description="Laporan mingguan terbaru, tren, dan status langganan."
      phase={15}
      links={[
        { label: "Laporan minggu contoh", href: "/ortu/laporan/2026-W40" },
        { label: "Langganan", href: "/ortu/langganan" },
      ]}
    />
  );
}
