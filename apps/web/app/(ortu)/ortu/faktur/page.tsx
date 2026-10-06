import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function InvoicesPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Orang tua"
      title="Faktur"
      relatedRoutes={[{ href: "/ortu/langganan", label: "Kembali ke langganan" }]}
    />
  );
}
