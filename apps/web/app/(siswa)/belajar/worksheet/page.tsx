import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function WorksheetListPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Siswa"
      title="Daftar worksheet"
      relatedRoutes={[
        { href: "/belajar/kerjakan/demo-assignment", label: "Kerjakan contoh" },
        { href: "/belajar/hasil/demo-assignment", label: "Lihat hasil contoh" },
      ]}
    />
  );
}
