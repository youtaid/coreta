import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function ReviewQueuePage() {
  return (
    <ScreenPlaceholder
      eyebrow="Admin"
      title="Antrean tinjauan"
      relatedRoutes={[{ href: "/admin/konten/butir/demo-item", label: "Tinjau butir contoh" }]}
    />
  );
}
