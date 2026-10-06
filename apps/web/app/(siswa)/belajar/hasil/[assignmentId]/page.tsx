import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function WorksheetResultPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Siswa"
      title="Hasil worksheet"
      relatedRoutes={[
        { href: "/belajar/progres", label: "Lihat progres" },
        { href: "/belajar", label: "Kembali ke jalur" },
      ]}
    />
  );
}
