import { Check } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Plan } from "@/lib/domain";
import { formatPercent, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

type PriceCardProps = Plan & {
  ctaLabel: string;
  ctaHref: string;
  /** Visually emphasize the recommended plan. */
  highlighted?: boolean;
  badge?: string;
  className?: string;
};

export function PriceCard({
  name,
  price,
  strikePrice,
  months,
  description,
  features,
  ctaLabel,
  ctaHref,
  highlighted = false,
  badge,
  className,
}: PriceCardProps) {
  const period = months === 1 ? "bulan" : `${months} bulan`;
  const saving = strikePrice && strikePrice > price ? 1 - price / strikePrice : null;

  return (
    <Card className={cn(highlighted && "ring-2 ring-primary", className)}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          {badge && <Badge>{badge}</Badge>}
        </div>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="flex-1 space-y-5">
        <div className="space-y-1">
          {strikePrice && (
            <p className="flex items-center gap-2 text-sm">
              <s className="text-muted-foreground">
                <span className="sr-only">Harga normal </span>
                {formatRupiah(strikePrice)}
              </s>
              {saving && (
                <span className="font-semibold text-success">Hemat {formatPercent(saving)}</span>
              )}
            </p>
          )}
          <p>
            <span className="font-heading text-3xl font-bold tracking-tight tabular-nums">
              {formatRupiah(price)}
            </span>
            <span className="text-muted-foreground"> / {period}</span>
          </p>
          {months > 1 && (
            <p className="text-sm text-muted-foreground">
              setara {formatRupiah(price / months)} per bulan
            </p>
          )}
        </div>
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex gap-2">
              <Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={highlighted ? "default" : "outline"}
          nativeButton={false}
          render={<Link href={ctaHref} />}
        >
          {ctaLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
