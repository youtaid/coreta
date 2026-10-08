import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Faktur — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Orang tua"
      title="Faktur"
      description="Daftar faktur, status bayar, dan unduhan PDF."
      phase={16}
      links={[{ label: "Langganan", href: "/ortu/langganan" }]}
    />
  );
}
