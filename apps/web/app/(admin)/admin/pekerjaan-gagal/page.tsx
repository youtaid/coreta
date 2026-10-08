import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Pekerjaan Gagal — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Admin"
      title="Pekerjaan Gagal"
      description="Antrean pekerjaan gagal dengan tombol coba ulang."
      phase={17}
    />
  );
}
