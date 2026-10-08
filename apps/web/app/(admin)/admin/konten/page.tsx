import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Daftar Butir Soal — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Admin"
      title="Daftar Butir Soal"
      description="Tabel butir, filter, impor, dan kesehatan butir."
      phase={18}
      links={[{ label: "Editor butir contoh", href: "/admin/konten/butir/item-mock-001" }]}
    />
  );
}
