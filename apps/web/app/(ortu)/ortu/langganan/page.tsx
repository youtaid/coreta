import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Langganan — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Orang tua"
      title="Langganan"
      description="Status langganan, paket, dan metode pembayaran."
      phase={16}
      links={[
        { label: "Faktur", href: "/ortu/faktur" },
        { label: "Lihat harga", href: "/harga" },
      ]}
    />
  );
}
