import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function ChildrenPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Orang tua"
      title="Profil anak"
      relatedRoutes={[{ href: "/ortu/laporan", label: "Lihat laporan" }]}
    />
  );
}
