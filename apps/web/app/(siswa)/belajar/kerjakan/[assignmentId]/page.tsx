import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function WorkspacePage() {
  return (
    <ScreenPlaceholder
      eyebrow="Siswa"
      title="Ruang kerja"
      relatedRoutes={[
        { href: "/belajar/hasil/demo-assignment", label: "Lihat hasil contoh" },
        { href: "/belajar/worksheet", label: "Kembali ke worksheet" },
      ]}
    />
  );
}
