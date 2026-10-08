import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Daftar Orang Tua — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Publik"
      title="Daftar Orang Tua"
      description="Buat akun orang tua dan pilih target siswa."
      phase={19}
      links={[{ label: "Buat akun siswa", href: "/ortu/anak" }]}
    />
  );
}
