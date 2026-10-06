import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function ContentListPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Admin"
      title="Daftar butir soal"
      relatedRoutes={[{ href: "/admin/konten/butir/demo-item", label: "Buka editor butir contoh" }]}
    />
  );
}
