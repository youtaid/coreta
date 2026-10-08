import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Log Agen AI — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Admin"
      title="Log Agen AI"
      description="Percakapan, label keluhan, panggilan alat, dan biaya AI harian."
      phase={17}
    />
  );
}
