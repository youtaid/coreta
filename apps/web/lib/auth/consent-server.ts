import "server-only";

import { CONSENT_VERSION, type ConsentType, isCurrentConsent } from "@/lib/consent";
import { createConsentToken, deriveConsentTokenKey, verifyConsentToken } from "@/lib/consent-token";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

let tokenKey: Buffer | undefined;

function consentTokenKey() {
  tokenKey ??= deriveConsentTokenKey(getServerEnv().SUPABASE_SERVICE_ROLE_KEY);
  return tokenKey;
}

export function consentLinkFor(parentId: string) {
  return `/persetujuan/${createConsentToken({ parentId, version: CONSENT_VERSION }, consentTokenKey())}`;
}

export function readConsentToken(token: string) {
  return verifyConsentToken(token, consentTokenKey(), { currentVersion: CONSENT_VERSION });
}

/** Persetujuan data anak untuk teks versi yang berlaku sudah diberikan? */
export async function hasCurrentConsent(parentId: string) {
  const { data, error } = await createAdminClient()
    .from("consents")
    .select("granted, version")
    .eq("parent_id", parentId)
    .eq("type", "data_anak")
    .maybeSingle();
  if (error) throw error;
  return isCurrentConsent(data);
}

export type ConsentSource = "daftar" | "sesi" | "token";

/**
 * Mencatat keputusan orang tua lewat fungsi record_consent (migrasi 0006): baris consents dan
 * audit_log dalam satu transaksi. Versi selalu dari server, tidak pernah dari isian klien.
 */
export async function recordConsent(input: {
  parentId: string;
  type: ConsentType;
  granted: boolean;
  actorId: string;
  source: ConsentSource;
}) {
  return createAdminClient().rpc("record_consent", {
    target_parent: input.parentId,
    consent_type: input.type,
    is_granted: input.granted,
    text_version: CONSENT_VERSION,
    actor: input.actorId,
    source: input.source,
  });
}

/**
 * Setelah orang tua menolak atau mencabut persetujuan data anak, sesi anak-anaknya dicabut:
 * masuk berikutnya ditolak (signInStudent memeriksa persetujuan wali), dan sesi yang sedang
 * berjalan tidak bisa diperpanjang. Mengembalikan jumlah anak yang sesinya dicabut.
 */
export async function revokeChildSessions(parentId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("guardianships")
    .select("students(profile_id)")
    .eq("parent_id", parentId);
  if (error) throw error;
  const profiles = (data ?? []).flatMap((row) => (row.students ? [row.students.profile_id] : []));
  for (const profileId of profiles) {
    const revoked = await admin.rpc("revoke_user_sessions", { target_user: profileId });
    if (revoked.error) throw revoked.error;
  }
  return profiles.length;
}
