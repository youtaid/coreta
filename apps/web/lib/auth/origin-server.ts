import "server-only";

import { headers } from "next/headers";

/**
 * Asal situs untuk tautan kembali dari Google dan email konfirmasi. Supabase Auth hanya mengikuti
 * alamat yang ada di daftar izin (site_url dan additional_redirect_urls), jadi header yang
 * dipalsukan tidak bisa membelokkan pengguna ke situs lain.
 */
export async function requestOrigin() {
  const list = await headers();
  const origin = list.get("origin");
  if (origin) return origin;
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const protocol = list.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export function isGoogleAuthEnabled() {
  return process.env.AUTH_GOOGLE_ENABLED === "true";
}
