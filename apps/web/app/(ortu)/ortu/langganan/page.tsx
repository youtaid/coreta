import { ScreenPlaceholder } from "@/components/domain/screen-placeholder";

export default function SubscriptionPage() {
  return (
    <ScreenPlaceholder
      eyebrow="Orang tua"
      title="Langganan"
      relatedRoutes={[
        { href: "/ortu/faktur", label: "Lihat faktur" },
        { href: "/harga", label: "Bandingkan harga" },
      ]}
    />
  );
}
