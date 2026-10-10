import { type AppRole, roleLandingPaths } from "@/lib/navigation";

/** Peran di tabel profiles (bahasa Inggris, aturan 10). */
export type DbRole = "parent" | "student" | "admin";

export type SignedInRole = Exclude<AppRole, "publik">;

const dbToAppRole: Record<DbRole, SignedInRole> = {
  parent: "ortu",
  student: "siswa",
  admin: "admin",
};

/**
 * Peran dari klaim JWT (`app_metadata.role`). Klaim ini hanya bisa diisi server dengan
 * service_role, sama seperti yang dibaca trigger handle_new_user (0001). Tanpa peran yang dikenal,
 * pengguna adalah orang tua — sama dengan aturan trigger itu.
 */
export function roleFromClaims(claims: { app_metadata?: unknown } | null | undefined) {
  if (!claims) return null;
  const metadata = claims.app_metadata;
  const role =
    typeof metadata === "object" && metadata !== null
      ? (metadata as Record<string, unknown>).role
      : undefined;
  return dbToAppRole[(role as DbRole) in dbToAppRole ? (role as DbRole) : "parent"];
}

/** Awalan rute yang hanya boleh dibuka satu peran. */
const protectedPrefixes: ReadonlyArray<readonly [prefix: string, role: SignedInRole]> = [
  ["/belajar", "siswa"],
  ["/bantuan", "siswa"],
  ["/ortu", "ortu"],
  ["/admin", "admin"],
];

/** Halaman yang tidak perlu dibuka lagi setelah masuk. */
const guestOnlyPaths = ["/masuk", "/daftar"];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function requiredRoleFor(pathname: string): SignedInRole | null {
  return protectedPrefixes.find(([prefix]) => matchesPrefix(pathname, prefix))?.[1] ?? null;
}

export type RouteDecision =
  | { action: "allow" }
  | { action: "redirect"; to: string; reason: "login-required" | "wrong-role" | "signed-in" };

/**
 * Keputusan penjaga peran untuk satu permintaan halaman. `search` adalah query asli (dengan "?")
 * agar pengguna kembali ke halaman yang sama setelah masuk.
 */
export function decideRoute(
  pathname: string,
  role: SignedInRole | null,
  search = "",
): RouteDecision {
  const required = requiredRoleFor(pathname);

  if (required) {
    if (!role) {
      const next = encodeURIComponent(`${pathname}${search}`);
      return { action: "redirect", to: `/masuk?next=${next}`, reason: "login-required" };
    }
    if (role !== required) {
      return { action: "redirect", to: roleLandingPaths[role], reason: "wrong-role" };
    }
    return { action: "allow" };
  }

  if (role && guestOnlyPaths.some((path) => matchesPrefix(pathname, path))) {
    return { action: "redirect", to: roleLandingPaths[role], reason: "signed-in" };
  }

  return { action: "allow" };
}

/**
 * Tujuan setelah masuk. Hanya jalur internal yang boleh (bukan `//evil.com`, `/\evil.com`, atau
 * URL penuh), dan hanya jalur yang boleh dibuka peran ini; selain itu ke halaman awal peran.
 */
export function landingAfterSignIn(role: SignedInRole, next: string | null | undefined) {
  const fallback = roleLandingPaths[role];
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }

  let url: URL;
  try {
    url = new URL(next, "http://coreta.invalid");
  } catch {
    return fallback;
  }
  if (url.origin !== "http://coreta.invalid") return fallback;

  const decision = decideRoute(url.pathname, role);
  if (decision.action !== "allow") return fallback;
  return `${url.pathname}${url.search}`;
}
