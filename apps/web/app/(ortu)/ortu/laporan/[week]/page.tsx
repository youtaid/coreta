import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function WeeklyReportPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Orang tua"
      title="Laporan mingguan"
      relatedRoutes={[
        { href: "/ortu/bantuan", label: "Tanya tentang laporan" },
        { href: "/ortu/langganan", label: "Kelola langganan" },
      ]}
    />
  );
}
