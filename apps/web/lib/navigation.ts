// Role-based navigation used by AppShell (components/domain/app-shell.tsx). Kept free of React
// so the matching rules can be unit-tested and reused by the role guard later (Fase 35).

export type AppRole = "student" | "parent" | "admin";

export const ROLE_LABELS: Record<AppRole, string> = {
  student: "Siswa",
  parent: "Orang tua",
  admin: "Admin",
};

/** Landing page per role after login (TIP §5). */
export const ROLE_HOME: Record<AppRole, string> = {
  student: "/belajar",
  parent: "/ortu/laporan",
  admin: "/admin/antrean",
};

/** Values accepted by the dev-only `?peran=` switch (no login yet). */
export const DEV_ROLE_PARAM = "peran";
export const DEV_ROLE_VALUES: Record<string, AppRole> = {
  siswa: "student",
  ortu: "parent",
  admin: "admin",
};

export function parseDevRole(value: string | string[] | undefined): AppRole | null {
  if (typeof value !== "string") return null;
  return DEV_ROLE_VALUES[value.toLowerCase()] ?? null;
}

export interface NavItem {
  /** Stable key, also used to pick the icon in AppShell. */
  key: string;
  label: string;
  href: string;
  /** Extra path prefixes that count as this item (e.g. the workspace under "Worksheet"). */
  matches?: string[];
}

export const NAV_ITEMS: Record<AppRole, NavItem[]> = {
  student: [
    { key: "path", label: "Jalur", href: "/belajar" },
    {
      key: "worksheet",
      label: "Worksheet",
      href: "/belajar/worksheet",
      matches: ["/belajar/kerjakan", "/belajar/hasil"],
    },
    { key: "progress", label: "Progres", href: "/belajar/progres" },
    { key: "help", label: "Bantuan", href: "/bantuan" },
  ],
  parent: [
    { key: "reports", label: "Laporan", href: "/ortu/laporan" },
    { key: "subscription", label: "Langganan", href: "/ortu/langganan", matches: ["/ortu/faktur"] },
    { key: "children", label: "Anak", href: "/ortu/anak" },
    { key: "help", label: "Bantuan", href: "/ortu/bantuan" },
  ],
  admin: [
    { key: "queue", label: "Antrean", href: "/admin/antrean" },
    { key: "agents", label: "Agen AI", href: "/admin/agen" },
    { key: "content", label: "Konten", href: "/admin/konten" },
    { key: "releases", label: "Rilis", href: "/admin/rilis" },
    { key: "users", label: "Pengguna", href: "/admin/pengguna" },
    { key: "failed-jobs", label: "Pekerjaan gagal", href: "/admin/pekerjaan-gagal" },
  ],
};

function matchLength(prefix: string, pathname: string): number {
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return prefix.length;
  return -1;
}

/**
 * The item to highlight for a pathname: the longest matching prefix wins, so "/belajar/progres"
 * highlights "Progres" rather than "Jalur" ("/belajar"). Returns null when nothing matches.
 */
export function findActiveItem(items: NavItem[], pathname: string): NavItem | null {
  let best: NavItem | null = null;
  let bestLength = -1;
  for (const item of items) {
    for (const prefix of [item.href, ...(item.matches ?? [])]) {
      const length = matchLength(prefix, pathname);
      if (length > bestLength) {
        best = item;
        bestLength = length;
      }
    }
  }
  return best;
}
