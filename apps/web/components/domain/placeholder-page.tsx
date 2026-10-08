import { Construction } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/domain/page-header";
import { Button } from "@/components/ui/button";

interface PlaceholderPageProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** TIP phase that builds the real screen. */
  phase: number;
  /** Onward routes from the screen map (TIP §5) so every route is reachable before it exists. */
  links?: { label: string; href: string }[];
}

// Temporary stand-in for screens that later phases build; delete once the last one is replaced.
export function PlaceholderPage({
  eyebrow,
  title,
  description,
  phase,
  links,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <section
        aria-label="Status halaman"
        className="flex flex-col gap-4 rounded-xl border border-dashed bg-card p-6 text-card-foreground"
      >
        <div className="flex items-start gap-3">
          <Construction className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold">Halaman placeholder</p>
            <p className="text-muted-foreground">
              Isi layar ini dibangun di Fase {phase}. Navigasi sudah berfungsi dan tautan di bawah
              mengikuti peta layar.
            </p>
          </div>
        </div>
        {links && links.length > 0 && (
          <ul className="flex flex-wrap gap-3">
            {links.map((link) => (
              <li key={link.href}>
                <Button variant="outline" nativeButton={false} render={<Link href={link.href} />}>
                  {link.label}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
