import { scoringPlaceholder } from "@coreta/scoring";
import { redirect } from "next/navigation";

import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";
import { getDevRoleLanding } from "@/lib/navigation";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const { peran } = await searchParams;
  const landing = getDevRoleLanding(peran);

  if (process.env.NODE_ENV === "development" && landing && landing !== "/") {
    redirect(`${landing}?peran=${Array.isArray(peran) ? peran[0] : peran}`);
  }

  return (
    <div data-scoring-status={scoringPlaceholder()}>
      <ScreenPlaceholder
        eyebrow="Publik"
        title="Belajar matematika dengan ruang coret digital"
        description="Placeholder halaman jual Coreta. Konten pemasaran lengkap akan dibuat pada Fase 19."
        relatedRoutes={[
          { href: "/harga", label: "Lihat harga" },
          { href: "/daftar", label: "Daftar orang tua" },
          { href: "/masuk", label: "Masuk" },
        ]}
      />
    </div>
  );
}
