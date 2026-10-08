import Link from "next/link";
import type { ReactNode } from "react";

import { DevRoleSwitcher } from "@/components/domain/dev-role-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Harga", href: "/harga" },
  { label: "Masuk", href: "/masuk" },
];

// Public pages share a simple top bar; the signed-in shells live in the other route groups.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b bg-card/95 text-card-foreground backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex min-h-touch items-center font-heading text-lg font-bold tracking-tight"
          >
            Coreta
          </Link>
          <nav aria-label="Menu publik" className="ml-auto flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-touch items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Button
              size="sm"
              className="hidden sm:inline-flex"
              nativeButton={false}
              render={<Link href="/daftar" />}
            >
              Daftar
            </Button>
          </nav>
          <DevRoleSwitcher className="hidden lg:flex" />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
        © 2026 Coreta
      </footer>
    </div>
  );
}
