import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Pengguna — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Admin"
      title="Pengguna"
      description="Pencarian pengguna, status langganan, dan tindakan."
      phase={18}
    />
  );
}
