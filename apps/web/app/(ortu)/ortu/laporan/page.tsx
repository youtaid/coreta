import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function ReportsPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Orang tua"
      title="Laporan"
      relatedRoutes={[
        { href: "/ortu/laporan/2026-W40", label: "Lihat laporan mingguan" },
        { href: "/ortu/langganan", label: "Kelola langganan" },
      ]}
    />
  );
}
