import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function StudentProgressPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Siswa"
      title="Progres"
      relatedRoutes={[{ href: "/belajar/worksheet", label: "Buka worksheet" }]}
    />
  );
}
