import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Harga — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Publik"
      title="Harga"
      description="Tiga paket langganan dengan uji coba 7 hari."
      phase={16}
      links={[{ label: "Daftar", href: "/daftar" }]}
    />
  );
}
