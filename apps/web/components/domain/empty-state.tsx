import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: { label: string; href: string };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      <div className="grid size-14 place-items-center rounded-full bg-secondary text-secondary-foreground">
        <Icon className="size-7" aria-hidden />
      </div>
      <p className="text-lg font-semibold">{title}</p>
      {description && <p className="max-w-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button className="mt-2" nativeButton={false} render={<Link href={action.href} />}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
