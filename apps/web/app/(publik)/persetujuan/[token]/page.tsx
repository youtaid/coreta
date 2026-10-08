import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Persetujuan Orang Tua — Coreta",
};

export default async function Page({ params }: PageProps<"/persetujuan/[token]">) {
  const { token } = await params;
  return (
    <PlaceholderPage
      eyebrow="Publik"
      title="Persetujuan Orang Tua"
      description={`Persetujuan dengan token ${token}.`}
      phase={19}
      links={[{ label: "Profil anak", href: "/ortu/anak" }]}
    />
  );
}
