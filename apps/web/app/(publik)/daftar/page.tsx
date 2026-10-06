import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function RegisterPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Publik"
      title="Daftar orang tua"
      relatedRoutes={[
        { href: "/persetujuan/demo-persetujuan", label: "Pratinjau persetujuan" },
        { href: "/ortu/anak", label: "Lanjut ke profil anak" },
      ]}
    />
  );
}
