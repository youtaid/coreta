import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Rilis Worksheet — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Admin"
      title="Rilis Worksheet"
      description="Worksheet mingguan dengan status draf/terbit."
      phase={18}
    />
  );
}
