import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Profil Anak — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Orang tua"
      title="Profil Anak"
      description="Daftar anak, akun siswa, target harian, dan data."
      phase={15}
      links={[{ label: "Laporan", href: "/ortu/laporan" }]}
    />
  );
}
