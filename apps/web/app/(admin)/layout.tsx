import type { ReactNode } from "react";

import { AppShell } from "@/components/domain/app-shell";

export default function Layout({ children }: { children: ReactNode }) {
  return <AppShell role="admin">{children}</AppShell>;
}
