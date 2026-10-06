import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function PricingPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Publik"
      title="Harga"
      relatedRoutes={[{ href: "/daftar", label: "Mulai daftar" }]}
    />
  );
}
