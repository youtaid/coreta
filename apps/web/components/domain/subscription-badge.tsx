import { Badge } from "@/components/ui/badge";
import type { SubscriptionStatus } from "@/lib/domain";

const statusMeta: Record<
  SubscriptionStatus,
  {
    label: string;
    variant: "secondary" | "success" | "outline" | "warning" | "destructive";
  }
> = {
  trialing: { label: "Uji coba", variant: "secondary" },
  active: { label: "Aktif", variant: "success" },
  paused: { label: "Dijeda", variant: "outline" },
  past_due: { label: "Menunggak", variant: "warning" },
  canceled: { label: "Dibatalkan", variant: "destructive" },
  expired: { label: "Berakhir", variant: "outline" },
};

export function SubscriptionBadge({
  status,
  className,
}: {
  status: SubscriptionStatus;
  className?: string;
}) {
  const meta = statusMeta[status];
  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label}
    </Badge>
  );
}
