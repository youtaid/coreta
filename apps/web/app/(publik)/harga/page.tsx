import { Gift, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/domain/page-header";
import { PriceCard } from "@/components/domain/price-card";
import { Card, CardContent } from "@/components/ui/card";
import { plans, TRIAL_DAYS } from "@/lib/mock/billing";

const cardOptions = {
  monthly: { ctaLabel: `Coba gratis ${TRIAL_DAYS} hari`, highlighted: false },
  semester: { ctaLabel: `Coba gratis ${TRIAL_DAYS} hari`, highlighted: false },
  annual: { ctaLabel: `Coba gratis ${TRIAL_DAYS} hari`, highlighted: true, badge: "Paling hemat" },
} as const;

export default function PricingPage() {
  return (
    <section className="space-y-10">
      <PageHeader
        eyebrow="Publik"
        title="Harga"
        description="Pilih paket yang pas. Semua paket dimulai dengan uji coba gratis."
      />

      <Card>
        <CardContent className="flex gap-4">
          <Gift className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
          <div className="space-y-1">
            <p className="font-heading text-lg font-semibold">Uji coba gratis {TRIAL_DAYS} hari</p>
            <p className="text-muted-foreground">
              Tanpa data pembayaran. Anak bisa langsung mencoba worksheet dan Anda bisa melihat
              laporan pertama sebelum memutuskan.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid items-stretch gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <PriceCard key={plan.id} {...plan} ctaHref="/daftar" {...cardOptions[plan.id]} />
        ))}
      </div>

      <Card>
        <CardContent className="flex gap-4">
          <ShieldCheck className="mt-1 size-6 shrink-0 text-success" aria-hidden />
          <div className="space-y-1">
            <p className="font-heading text-lg font-semibold">Pengembalian dana</p>
            <p className="text-muted-foreground">
              Ringkasan kebijakan pengembalian dana akan ditampilkan di sini sebelum Coreta
              diluncurkan.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
