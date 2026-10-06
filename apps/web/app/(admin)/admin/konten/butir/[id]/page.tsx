import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function ItemEditorPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Admin"
      title="Editor butir"
      relatedRoutes={[{ href: "/admin/konten", label: "Kembali ke daftar butir" }]}
    />
  );
}
