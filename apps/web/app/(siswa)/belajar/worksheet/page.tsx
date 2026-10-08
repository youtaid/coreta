import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Daftar Worksheet — Coreta",
};

export default function Page() {
  return (
    <PlaceholderPage
      eyebrow="Belajar"
      title="Daftar Worksheet"
      description="Worksheet minggu ini, ulang berjarak, dan yang sudah selesai."
      phase={9}
      links={[
        { label: "Kerjakan worksheet contoh", href: "/belajar/kerjakan/ws-mock-301" },
        { label: "Lihat hasil contoh", href: "/belajar/hasil/ws-mock-201" },
      ]}
    />
  );
}
