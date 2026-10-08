import Link from "next/link";

import { type AppRole, DEV_ROLE_PARAM, DEV_ROLE_VALUES, ROLE_LABELS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface DevRoleSwitcherProps {
  current?: AppRole;
  className?: string;
}

/**
 * Jumps between the three role shells while there is no login (TIP Fase 7). Renders nothing
 * outside `next dev`; the `?peran=` query it links to is ignored in production as well.
 */
export function DevRoleSwitcher({ current, className }: DevRoleSwitcherProps) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <nav
      aria-label="Ganti peran (hanya mode pengembangan)"
      className={cn(
        "flex items-center gap-0.5 rounded-lg border border-dashed border-warning/60 p-0.5 text-xs",
        className,
      )}
    >
      {Object.entries(DEV_ROLE_VALUES).map(([param, role]) => (
        <Link
          key={param}
          href={`/?${DEV_ROLE_PARAM}=${param}`}
          aria-current={role === current ? "true" : undefined}
          className={cn(
            "flex min-h-9 items-center rounded-md px-2 font-medium whitespace-nowrap text-muted-foreground hover:bg-muted hover:text-foreground",
            role === current && "bg-warning/15 text-warning hover:text-warning",
          )}
        >
          {ROLE_LABELS[role]}
        </Link>
      ))}
    </nav>
  );
}
