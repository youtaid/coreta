import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Masuk — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Publik"
      title="Masuk"
      description="Masuk sebagai orang tua, siswa, atau admin."
      phase={19}
      links={[
        { label: "Beranda siswa", href: "/belajar" },
        { label: "Beranda orang tua", href: "/ortu/laporan" },
        { label: "Beranda admin", href: "/admin/antrean" },
      ]}
    />
  );
}
