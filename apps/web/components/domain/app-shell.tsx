"use client";

import {
  BarChart3,
  BookOpen,
  Bot,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileText,
  House,
  Library,
  ListChecks,
  LogIn,
  Menu,
  PencilLine,
  RefreshCw,
  Rocket,
  Tag,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  appRoles,
  type AppRole,
  isNavigationItemActive,
  type NavigationIcon,
  type NavigationItem,
  navigationByRole,
  roleLabels,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface AppShellProps {
  role: AppRole;
  children: ReactNode;
}

const navigationIcons: Record<NavigationIcon, LucideIcon> = {
  home: House,
  price: Tag,
  login: LogIn,
  register: UserPlus,
  path: BookOpen,
  worksheet: ClipboardList,
  progress: BarChart3,
  help: CircleHelp,
  report: FileText,
  subscription: CreditCard,
  children: Users,
  queue: ListChecks,
  agent: Bot,
  content: Library,
  release: Rocket,
  users: UserCog,
  "failed-job": RefreshCw,
};

function Brand() {
  return (
    <Link
      href="/"
      className="inline-flex min-h-touch items-center gap-3 rounded-lg font-heading text-lg font-bold tracking-tight focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <PencilLine className="size-5" aria-hidden />
      </span>
      Coreta
    </Link>
  );
}

function DevRoleSwitcher({ role, compact = false }: { role: AppRole; compact?: boolean }) {
  const router = useRouter();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <label
      className={cn("grid gap-1 text-xs font-semibold text-muted-foreground", compact && "block")}
    >
      {!compact && <span>Pratinjau peran</span>}
      <select
        aria-label="Pratinjau peran"
        value={role}
        onChange={(event) => router.push(`/?peran=${event.target.value}`)}
        className={cn(
          "h-touch rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring",
          compact && "w-28 sm:w-32",
        )}
      >
        {appRoles.map((item) => (
          <option key={item} value={item}>
            {roleLabels[item]}
          </option>
        ))}
      </select>
    </label>
  );
}

function NavigationLink({
  item,
  pathname,
  variant,
  onNavigate,
}: {
  item: NavigationItem;
  pathname: string;
  variant: "header" | "bottom" | "sidebar" | "mobile-menu";
  onNavigate?: () => void;
}) {
  const Icon = navigationIcons[item.icon];
  const active = isNavigationItemActive(pathname, item);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "group inline-flex min-h-touch items-center rounded-lg font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variant === "header" && "gap-2 px-3 text-sm",
        variant === "bottom" &&
          "min-w-0 flex-1 flex-col justify-center gap-1 rounded-xl px-1 py-2 text-xs sm:text-sm",
        variant === "sidebar" && "w-full gap-3 px-3 py-2 text-sm",
        variant === "mobile-menu" && "gap-2 px-3 py-2 text-sm",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className={cn("size-5 shrink-0", variant === "header" && "size-4")} aria-hidden />
      <span className={cn(variant === "bottom" && "max-w-full truncate")}>{item.label}</span>
    </Link>
  );
}

function PublicHeader({ pathname }: { pathname: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:px-6 lg:px-8">
        <Brand />
        <div className="flex items-center gap-2">
          <DevRoleSwitcher role="publik" compact />
          <ThemeToggle />
        </div>
        <nav
          aria-label="Navigasi publik"
          className="order-last flex w-full flex-wrap gap-2 sm:order-none sm:w-auto"
        >
          {navigationByRole.publik.map((item) => (
            <NavigationLink key={item.href} item={item} pathname={pathname} variant="header" />
          ))}
        </nav>
      </div>
    </header>
  );
}

function RoleHeader({ role }: { role: "siswa" | "ortu" }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Brand />
          <span className="hidden rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground sm:inline-flex">
            {roleLabels[role]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DevRoleSwitcher role={role} compact />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function BottomNavigation({ role, pathname }: { role: "siswa" | "ortu"; pathname: string }) {
  return (
    <nav
      aria-label={`Navigasi ${roleLabels[role].toLowerCase()}`}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
    >
      <div className="mx-auto flex w-full max-w-2xl gap-2">
        {navigationByRole[role].map((item) => (
          <NavigationLink key={item.href} item={item} pathname={pathname} variant="bottom" />
        ))}
      </div>
    </nav>
  );
}

function AdminShell({ children, pathname }: { children: ReactNode; pathname: string }) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="hidden border-r bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:p-5">
        <Brand />
        <p className="mt-6 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Admin
        </p>
        <nav aria-label="Navigasi admin" className="mt-2 flex flex-1 flex-col gap-1">
          {navigationByRole.admin.map((item) => (
            <NavigationLink key={item.href} item={item} pathname={pathname} variant="sidebar" />
          ))}
        </nav>
        <div className="space-y-3 border-t pt-4">
          <DevRoleSwitcher role="admin" />
          <ThemeToggle />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b bg-background/95 px-4 py-2 backdrop-blur-sm md:hidden">
          <div className="flex items-center justify-between gap-3">
            <Brand />
            <div className="flex items-center gap-2">
              <DevRoleSwitcher role="admin" compact />
              <ThemeToggle />
            </div>
          </div>
          <details ref={menuRef} className="group mt-2">
            <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between rounded-lg border bg-card px-3 font-medium focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
              Menu admin
              <Menu className="size-5" aria-hidden />
            </summary>
            <nav
              aria-label="Navigasi admin seluler"
              className="mt-2 grid grid-cols-2 gap-2 rounded-xl border bg-card p-2"
            >
              {navigationByRole.admin.map((item) => (
                <NavigationLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  variant="mobile-menu"
                  onNavigate={() => menuRef.current?.removeAttribute("open")}
                />
              ))}
            </nav>
          </details>
        </header>

        <MainContent className="px-4 py-8 sm:px-6 lg:px-10">{children}</MainContent>
      </div>
    </div>
  );
}

function MainContent({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) {
      mainRef.current?.focus({ preventScroll: true });
    } else {
      mounted.current = true;
    }
  }, [pathname]);

  return (
    <main
      ref={mainRef}
      id="konten-utama"
      tabIndex={-1}
      className={cn("mx-auto w-full max-w-7xl focus:outline-none", className)}
    >
      {children}
    </main>
  );
}

export function AppShell({ role, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <>
      <a
        href="#konten-utama"
        className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-transform focus:translate-y-0 focus:ring-3 focus:ring-ring focus:outline-none motion-reduce:transition-none"
      >
        Lewati ke konten utama
      </a>

      {role === "admin" ? (
        <AdminShell pathname={pathname}>{children}</AdminShell>
      ) : (
        <div className="flex min-h-dvh flex-col">
          {role === "publik" ? <PublicHeader pathname={pathname} /> : <RoleHeader role={role} />}
          <MainContent
            className={cn(
              "flex-1 px-4 py-8 sm:px-6 lg:px-8",
              role !== "publik" && "pb-[calc(7rem+env(safe-area-inset-bottom))]",
            )}
          >
            {children}
          </MainContent>
          {role !== "publik" && <BottomNavigation role={role} pathname={pathname} />}
        </div>
      )}
    </>
  );
}
