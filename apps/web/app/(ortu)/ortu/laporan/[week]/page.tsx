import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Laporan Mingguan — Coreta",
};

export default async function Page({ params }: PageProps<"/ortu/laporan/[week]">) {
  const { week } = await params;
  return (
    <PlaceholderPage
      eyebrow="Orang tua"
      title="Laporan Mingguan"
      description={`Laporan minggu ${week}.`}
      phase={15}
      links={[
        { label: "Tanya tentang laporan", href: "/ortu/bantuan" },
        { label: "Langganan", href: "/ortu/langganan" },
      ]}
    />
  );
}
