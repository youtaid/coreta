import { BookOpenCheck } from "lucide-react";
import Link from "next/link";

import { CompetencyBar } from "@/components/domain/competency-bar";
import { EmptyState } from "@/components/domain/empty-state";
import { PageHeader } from "@/components/domain/page-header";
import { PathNode } from "@/components/domain/path-node";
import { PlaceholderPage } from "@/components/domain/placeholder-page";
import { PriceCard } from "@/components/domain/price-card";
import { StatCard } from "@/components/domain/stat-card";
import { SubscriptionBadge } from "@/components/domain/subscription-badge";
import { WorksheetCard } from "@/components/domain/worksheet-card";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_STATUSES } from "@/lib/domain";
import { NAV_ITEMS, ROLE_HOME, ROLE_LABELS } from "@/lib/navigation";
import { plans } from "@/lib/mock/billing";
import { competencies, stages, weeklyStats, worksheets } from "@/lib/mock/learning";

import { Section } from "./section";

export function DomainGallery() {
  return (
    <>
      <p
        id="domain"
        className="-mb-6 border-t pt-10 text-sm font-semibold tracking-wide text-muted-foreground uppercase"
      >
        Komponen domain · data tiruan dari <code>lib/mock</code>
      </p>

      <Section id="page-header" title="PageHeader">
        <div className="rounded-xl border bg-card p-6">
          <PageHeader
            eyebrow="Belajar"
            title="Jalur Belajar"
            description="Selesaikan tahap demi tahap. Tahap berikutnya terbuka setelah semua kompetensi tuntas."
            actions={
              <>
                <Button variant="outline">Lihat progres</Button>
                <Button>Lanjut belajar</Button>
              </>
            }
          />
        </div>
      </Section>

      <Section id="path-node" title="PathNode">
        <ol className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage) => (
            <li key={stage.number}>
              <PathNode {...stage} href={`/belajar?tahap=${stage.number}`} />
            </li>
          ))}
        </ol>
      </Section>

      <Section id="stat-card" title="StatCard">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {weeklyStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </Section>

      <Section id="competency-bar" title="CompetencyBar (KompetensiBar)">
        <div className="grid max-w-2xl gap-6 rounded-xl border bg-card p-6">
          {competencies.map((competency) => (
            <CompetencyBar key={competency.code} {...competency} />
          ))}
        </div>
      </Section>

      <Section id="worksheet-card" title="WorksheetCard">
        <div className="grid gap-4 sm:grid-cols-2">
          {worksheets.map((worksheet) => (
            <WorksheetCard
              key={worksheet.id}
              {...worksheet}
              href={
                worksheet.status === "completed"
                  ? `/belajar/hasil/${worksheet.id}`
                  : `/belajar/kerjakan/${worksheet.id}`
              }
            />
          ))}
        </div>
      </Section>

      <Section id="subscription-badge" title="SubscriptionBadge">
        <div className="flex flex-wrap gap-2">
          {SUBSCRIPTION_STATUSES.map((status) => (
            <SubscriptionBadge key={status} status={status} />
          ))}
        </div>
      </Section>

      <Section id="price-card" title="PriceCard">
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <PriceCard
              key={plan.id}
              {...plan}
              highlighted={plan.id === "semester"}
              badge={plan.id === "semester" ? "Paling populer" : undefined}
              ctaLabel="Coba gratis 7 hari"
              ctaHref={`/daftar?paket=${plan.id}`}
            />
          ))}
        </div>
      </Section>

      <Section id="empty-state" title="EmptyState">
        <EmptyState
          icon={BookOpenCheck}
          title="Belum ada worksheet"
          description="Worksheet minggu ini terbit setiap Senin pagi. Sambil menunggu, ulangi tahap yang sudah tuntas."
          action={{ label: "Buka jalur belajar", href: "/belajar" }}
        />
      </Section>

      <Section id="app-shell" title="AppShell">
        <p className="text-muted-foreground">
          Kerangka navigasi per peran membungkus seluruh halaman, jadi dilihat langsung di rutenya.
          Tiap tautan di bawah membuka beranda peran beserta menunya.
        </p>
        <ul className="grid gap-4 md:grid-cols-3">
          {(["student", "parent", "admin"] as const).map((role) => (
            <li key={role} className="rounded-xl border bg-card p-4 text-card-foreground">
              <p className="font-semibold">{ROLE_LABELS[role]}</p>
              <p className="mb-3 text-sm text-muted-foreground">
                {NAV_ITEMS[role].map((item) => item.label).join(" · ")}
              </p>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={ROLE_HOME[role]} />}
              >
                Buka {ROLE_HOME[role]}
              </Button>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="placeholder-page" title="PlaceholderPage">
        <div className="rounded-xl border bg-card p-6">
          <PlaceholderPage
            eyebrow="Contoh"
            title="Halaman contoh"
            description="Dipakai setiap rute sampai layar aslinya dibangun."
            phase={99}
            links={[{ label: "Jalur belajar", href: "/belajar" }]}
          />
        </div>
      </Section>
    </>
  );
}
