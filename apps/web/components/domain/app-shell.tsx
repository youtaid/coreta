"use client";

import {
  Bot,
  CreditCard,
  FileText,
  Inbox,
  Library,
  LifeBuoy,
  ListChecks,
  type LucideIcon,
  Rocket,
  Route,
  TrendingUp,
  TriangleAlert,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { DevRoleSwitcher } from "@/components/domain/dev-role-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  type AppRole,
  NAV_ITEMS,
  type NavItem,
  ROLE_HOME,
  ROLE_LABELS,
  findActiveItem,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface AppShellProps {
  role: AppRole;
  children: ReactNode;
}

const icons: Record<string, LucideIcon> = {
  path: Route,
  worksheet: ListChecks,
  progress: TrendingUp,
  help: LifeBuoy,
  reports: FileText,
  subscription: CreditCard,
  children: Users,
  queue: Inbox,
  agents: Bot,
  content: Library,
  releases: Rocket,
  users: UserCog,
  "failed-jobs": TriangleAlert,
};

/**
 * Navigation frame per role (TIP Fase 7): students get a bottom bar on every screen size, parents
 * a bottom bar on phones and a top bar from tablet width, admins a sidebar from tablet width and
 * a scrollable top bar on phones. Pages render inside `<main>`.
 */
export function AppShell({ role, children }: AppShellProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];
  const active = findActiveItem(items, pathname);
  const isActive = (item: NavItem) => item.key === active?.key;

  const brand = (
    <Link
      href={ROLE_HOME[role]}
      className="flex min-h-touch items-center gap-2 rounded-lg font-heading text-lg font-bold tracking-tight"
    >
      Coreta
      <span className="rounded-full bg-secondary px-2.5 py-0.5 font-sans text-xs font-semibold whitespace-nowrap text-secondary-foreground">
        {ROLE_LABELS[role]}
      </span>
    </Link>
  );

  const tools = (
    <div className="ml-auto flex items-center gap-2">
      <DevRoleSwitcher current={role} className="hidden sm:flex" />
      <ThemeToggle />
    </div>
  );

  if (role === "admin") {
    return (
      <div className="flex min-h-full flex-1 flex-col md:flex-row">
        <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-dvh">
          <div className="flex h-14 items-center border-b px-4">{brand}</div>
          <nav aria-label="Menu admin" className="flex flex-1 flex-col gap-1 p-3">
            {items.map((item) => (
              <SidebarLink key={item.key} item={item} active={isActive(item)} />
            ))}
          </nav>
          <div className="border-t p-3">
            <DevRoleSwitcher current={role} />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b bg-card/95 text-card-foreground backdrop-blur">
            <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
              <span className="md:hidden">{brand}</span>
              <p className="hidden text-sm font-medium text-muted-foreground md:block">
                {active?.label ?? "Admin"}
              </p>
              {tools}
            </div>
            <nav
              aria-label="Menu admin"
              className="flex gap-1 overflow-x-auto border-t px-2 md:hidden"
            >
              {items.map((item) => (
                <TopLink key={item.key} item={item} active={isActive(item)} />
              ))}
            </nav>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    );
  }

  const bottomNavAlways = role === "student";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b bg-card/95 text-card-foreground backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
          {brand}
          {!bottomNavAlways && (
            <nav aria-label={`Menu ${ROLE_LABELS[role].toLowerCase()}`} className="hidden md:flex">
              {items.map((item) => (
                <TopLink key={item.key} item={item} active={isActive(item)} />
              ))}
            </nav>
          )}
          {tools}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <nav
        aria-label={`Menu ${ROLE_LABELS[role].toLowerCase()}`}
        className={cn(
          "sticky bottom-0 z-20 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] text-card-foreground backdrop-blur",
          !bottomNavAlways && "md:hidden",
        )}
      >
        <ul className="mx-auto grid w-full max-w-xl auto-cols-fr grid-flow-col px-2 py-1">
          {items.map((item) => (
            <li key={item.key}>
              <BottomLink item={item} active={isActive(item)} />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function BottomLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = icons[item.key];
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-touch flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
        active && "text-primary hover:text-primary",
      )}
    >
      {Icon && <Icon className="size-5" aria-hidden />}
      {item.label}
    </Link>
  );
}

function TopLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-touch shrink-0 items-center border-b-2 border-transparent px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
        active && "border-primary text-foreground",
      )}
    >
      {item.label}
    </Link>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = icons[item.key];
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-touch items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent text-sidebar-primary hover:text-sidebar-primary",
      )}
    >
      {Icon && <Icon className="size-5" aria-hidden />}
      {item.label}
    </Link>
  );
}
