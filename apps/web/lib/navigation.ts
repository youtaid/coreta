export const appRoles = ["publik", "siswa", "ortu", "admin"] as const;

export type AppRole = (typeof appRoles)[number];

export type NavigationIcon =
  | "home"
  | "price"
  | "login"
  | "register"
  | "path"
  | "worksheet"
  | "progress"
  | "help"
  | "report"
  | "subscription"
  | "children"
  | "queue"
  | "agent"
  | "content"
  | "release"
  | "users"
  | "failed-job";

export interface NavigationItem {
  label: string;
  href: string;
  icon: NavigationIcon;
  additionalActivePrefixes?: readonly string[];
}

export const roleLabels: Record<AppRole, string> = {
  publik: "Publik",
  siswa: "Siswa",
  ortu: "Orang tua",
  admin: "Admin",
};

export const roleLandingPaths: Record<AppRole, string> = {
  publik: "/",
  siswa: "/belajar",
  ortu: "/ortu/laporan",
  admin: "/admin/antrean",
};

export const navigationByRole: Record<AppRole, readonly NavigationItem[]> = {
  publik: [
    { label: "Beranda", href: "/", icon: "home" },
    { label: "Harga", href: "/harga", icon: "price" },
    { label: "Masuk", href: "/masuk", icon: "login" },
    { label: "Daftar", href: "/daftar", icon: "register" },
  ],
  siswa: [
    { label: "Jalur", href: "/belajar", icon: "path" },
    {
      label: "Worksheet",
      href: "/belajar/worksheet",
      icon: "worksheet",
      additionalActivePrefixes: ["/belajar/kerjakan", "/belajar/hasil"],
    },
    { label: "Progres", href: "/belajar/progres", icon: "progress" },
    { label: "Bantuan", href: "/bantuan", icon: "help" },
  ],
  ortu: [
    { label: "Laporan", href: "/ortu/laporan", icon: "report" },
    { label: "Langganan", href: "/ortu/langganan", icon: "subscription" },
    { label: "Anak", href: "/ortu/anak", icon: "children" },
    { label: "Bantuan", href: "/ortu/bantuan", icon: "help" },
  ],
  admin: [
    { label: "Antrean", href: "/admin/antrean", icon: "queue" },
    { label: "Agen AI", href: "/admin/agen", icon: "agent" },
    { label: "Konten", href: "/admin/konten", icon: "content" },
    { label: "Rilis", href: "/admin/rilis", icon: "release" },
    { label: "Pengguna", href: "/admin/pengguna", icon: "users" },
    { label: "Pekerjaan gagal", href: "/admin/pekerjaan-gagal", icon: "failed-job" },
  ],
};

/** Concrete URLs used to verify every screen in TIP section 5, including dynamic routes. */
export const screenRouteSamples = [
  "/",
  "/harga",
  "/masuk",
  "/daftar",
  "/persetujuan/demo-persetujuan",
  "/belajar",
  "/belajar/worksheet",
  "/belajar/kerjakan/demo-assignment",
  "/belajar/hasil/demo-assignment",
  "/belajar/progres",
  "/bantuan",
  "/ortu/laporan",
  "/ortu/laporan/2026-W40",
  "/ortu/langganan",
  "/ortu/faktur",
  "/ortu/anak",
  "/ortu/bantuan",
  "/admin/antrean",
  "/admin/agen",
  "/admin/konten",
  "/admin/konten/butir/demo-item",
  "/admin/rilis",
  "/admin/pengguna",
  "/admin/pekerjaan-gagal",
] as const;

function pathMatchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isNavigationItemActive(pathname: string, item: NavigationItem) {
  if (item.href === "/" || item.href === "/belajar") {
    return pathname === item.href;
  }

  return (
    pathMatchesPrefix(pathname, item.href) ||
    item.additionalActivePrefixes?.some((prefix) => pathMatchesPrefix(pathname, prefix)) === true
  );
}

export function getDevRoleLanding(value: string | string[] | undefined) {
  const role = Array.isArray(value) ? value[0] : value;

  return appRoles.includes(role as AppRole) ? roleLandingPaths[role as AppRole] : undefined;
}
