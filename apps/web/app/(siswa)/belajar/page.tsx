import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function LearningPathPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Siswa"
      title="Jalur belajar"
      relatedRoutes={[
        { href: "/belajar/worksheet", label: "Buka worksheet" },
        { href: "/belajar/progres", label: "Lihat progres" },
      ]}
    />
  );
}
