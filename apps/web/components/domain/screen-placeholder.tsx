import Link from "next/link";

import { PageHeader } from "@/components/domain/page-header";

interface RelatedRoute {
  href: string;
  label: string;
}

interface ScreenPlaceholderProps {
  title: string;
  eyebrow: string;
  description?: string;
  relatedRoutes?: readonly RelatedRoute[];
}

export function ScreenPlaceholder({
  title,
  eyebrow,
  description = "Kerangka halaman siap. Konten lengkap akan dibangun pada fase UI terkait.",
  relatedRoutes = [],
}: ScreenPlaceholderProps) {
  return (
    <section className="space-y-8">
      <PageHeader title={title} eyebrow={eyebrow} description={description} />

      {relatedRoutes.length > 0 && (
        <nav aria-label={`Rute terkait ${title}`} className="flex flex-wrap gap-3">
          {relatedRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="inline-flex min-h-touch items-center rounded-lg border bg-card px-4 py-2 font-medium text-card-foreground transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              {route.label}
            </Link>
          ))}
        </nav>
      )}
    </section>
  );
}
