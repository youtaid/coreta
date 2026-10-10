import type { ReactNode } from "react";

import { AppShell } from "@/components/domain/app-shell";

export default function ParentLayout({ children }: { children: ReactNode }) {
  return <AppShell role="ortu">{children}</AppShell>;
}
