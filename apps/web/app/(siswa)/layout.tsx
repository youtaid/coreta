import type { ReactNode } from "react";

import { AppShell } from "@/components/domain/app-shell";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <AppShell role="siswa">{children}</AppShell>;
}
