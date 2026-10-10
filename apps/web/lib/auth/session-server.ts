import "server-only";

import { roleFromClaims, landingAfterSignIn, type SignedInRole } from "@/lib/auth/roles";
import { consentLinkFor, hasCurrentConsent } from "@/lib/auth/consent-server";
import { createClient } from "@/lib/supabase/server";

/**
 * Tujuan setelah masuk (kata sandi, Google, atau tautan email). Orang tua yang belum menyetujui
 * teks persetujuan versi terbaru diarahkan dulu ke halaman persetujuan.
 */
export async function destinationAfterSignIn(
  user: { id: string; app_metadata?: unknown },
  next: string | null | undefined,
): Promise<{ role: SignedInRole; to: string }> {
  const role = roleFromClaims({ app_metadata: user.app_metadata }) ?? "ortu";
  if (role === "ortu" && !(await hasCurrentConsent(user.id))) {
    return { role, to: consentLinkFor(user.id) };
  }
  return { role, to: landingAfterSignIn(role, next) };
}

/** Pengguna yang sedang masuk menurut JWT yang sudah diverifikasi (getClaims), atau null. */
export async function currentUser(): Promise<{ id: string; role: SignedInRole } | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims.sub;
  const role = roleFromClaims(data?.claims);
  return typeof id === "string" && role ? { id, role } : null;
}
