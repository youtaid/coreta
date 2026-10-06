import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function ConsentPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Publik"
      title="Persetujuan orang tua"
      relatedRoutes={[{ href: "/ortu/anak", label: "Lanjut ke profil anak" }]}
    />
  );
}
