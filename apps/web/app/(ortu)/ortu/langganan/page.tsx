import Link from "next/link";

import { PageHeader } from "@/components/domain/page-header";
import { SubscriptionActions } from "@/components/domain/subscription-actions";
import { SubscriptionBadge } from "@/components/domain/subscription-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SUBSCRIPTION_STATUSES } from "@/lib/domain";
import { formatRupiah } from "@/lib/format";
import { defaultSubscriptionStatus, getPlan, subscriptionViews } from "@/lib/mock/billing";
import { getSubscriptionActions, parseSubscriptionStatus } from "@/lib/subscription";
import { cn } from "@/lib/utils";

interface SubscriptionPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SubscriptionPage({ searchParams }: SubscriptionPageProps) {
  const isDev = process.env.NODE_ENV === "development";
  // Previewing another status through ?status= works only in development, like ?peran=.
  const requested = isDev ? parseSubscriptionStatus((await searchParams).status) : undefined;
  const status = requested ?? defaultSubscriptionStatus;

  const view = subscriptionViews[status];
  const plan = getPlan(view.planId);
  const period = plan.months === 1 ? "bulan" : `${plan.months} bulan`;

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Orang tua"
        title="Langganan"
        description="Lihat status langganan, ganti paket, atau atur jeda dan pembatalan."
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/harga" />}>
              Bandingkan harga
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/ortu/faktur" />}>
              Lihat faktur
            </Button>
          </>
        }
      />

      {isDev && (
        <nav
          aria-label="Pratinjau status langganan"
          className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-3 text-sm"
        >
          <span className="font-semibold text-muted-foreground">Pratinjau status:</span>
          {SUBSCRIPTION_STATUSES.map((item) => (
            <Link
              key={item}
              href={`/ortu/langganan?status=${item}`}
              aria-current={item === status ? "true" : undefined}
              className={cn(
                "inline-flex min-h-touch items-center rounded-lg border px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring",
                item === status ? "border-primary bg-secondary" : "hover:bg-accent",
              )}
            >
              <SubscriptionBadge status={item} />
            </Link>
          ))}
        </nav>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="font-heading text-xl">Paket {plan.name}</CardTitle>
            <SubscriptionBadge status={view.status} />
          </div>
          <CardDescription className="max-w-2xl text-base">{view.summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-muted-foreground">Harga</dt>
              <dd className="font-semibold tabular-nums">
                {formatRupiah(plan.price)} / {period}
              </dd>
              {plan.strikePrice && (
                <dd className="text-sm text-muted-foreground">
                  <s>
                    <span className="sr-only">Harga normal </span>
                    {formatRupiah(plan.strikePrice)}
                  </s>
                </dd>
              )}
            </div>
            {view.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                <dd className="font-semibold">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <SubscriptionActions actions={getSubscriptionActions(view.status)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Metode bayar</CardTitle>
        </CardHeader>
        <CardContent>
          {view.paymentMethod ? (
            <p className="font-semibold">{view.paymentMethod}</p>
          ) : (
            <p className="text-muted-foreground">
              Belum ada metode bayar. Anda akan memilihnya saat memilih paket.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
