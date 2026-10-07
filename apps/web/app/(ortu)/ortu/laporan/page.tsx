import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/domain/page-header";
import { StatCard } from "@/components/domain/stat-card";
import { SubscriptionBadge } from "@/components/domain/subscription-badge";
import { TrendChart } from "@/components/domain/trend-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import { plans } from "@/lib/mock/billing";
import { childName, weeklyReports, weeklyTrend } from "@/lib/mock/report";

const reportHrefs = Object.fromEntries(
  weeklyReports.map((report) => [report.weekId, `/ortu/laporan/${report.weekId}`]),
);

export default function ReportsPage() {
  const latest = weeklyReports[0];
  const plan = plans.find((item) => item.id === "semester");

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Orang tua"
        title="Laporan"
        description={`Perkembangan belajar ${childName}, diperbarui setiap Senin.`}
      />

      {latest && (
        <Card>
          <CardHeader>
            <CardDescription>Laporan terbaru · {latest.weekLabel}</CardDescription>
            <CardTitle className="font-heading text-xl leading-snug">{latest.headline}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {latest.stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>
            <Button nativeButton={false} render={<Link href={`/ortu/laporan/${latest.weekId}`} />}>
              Buka laporan lengkap
              <ArrowRight aria-hidden data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Tren mingguan</CardTitle>
            <CardDescription>
              Akurasi dan jumlah soal enam minggu terakhir. Pilih minggu untuk membuka laporannya.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart points={weeklyTrend} hrefs={reportHrefs} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Langganan</CardTitle>
            <CardDescription>Ringkasan paket yang sedang berjalan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <SubscriptionBadge status="active" />
              {plan && <span className="font-semibold">Paket {plan.name}</span>}
            </div>
            {plan && (
              <p className="text-muted-foreground">
                {formatRupiah(plan.price)} untuk {plan.months} bulan.
              </p>
            )}
            <Button variant="outline" nativeButton={false} render={<Link href="/ortu/langganan" />}>
              Kelola langganan
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
