import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";

import { z } from "zod";

/**
 * Token tautan persetujuan (`/persetujuan/[token]`, dikirim lewat email atau pesan). Isinya
 * id orang tua, versi teks, dan waktu kedaluwarsa, ditandatangani HMAC-SHA256. Tidak disimpan di
 * basis data: siapa pun yang tidak memegang kunci server tidak bisa membuat atau mengubahnya.
 */
export const CONSENT_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const payloadSchema = z.object({
  p: z.uuid(),
  v: z.string().min(1),
  e: z.number().int().positive(),
});

export interface ConsentTokenPayload {
  parentId: string;
  version: string;
  expiresAt: number;
}

export type ConsentTokenResult =
  | { ok: true; payload: ConsentTokenPayload }
  | { ok: false; reason: "malformed" | "bad-signature" | "expired" | "wrong-version" };

/**
 * Kunci HMAC diturunkan (HKDF) dari rahasia server, dengan label khusus agar kunci ini tidak
 * bisa dipakai untuk keperluan lain dan rahasia aslinya tidak pernah dipakai langsung.
 */
export function deriveConsentTokenKey(serverSecret: string) {
  if (!serverSecret) throw new Error("Rahasia server untuk token persetujuan kosong.");
  return Buffer.from(hkdfSync("sha256", serverSecret, "coreta", "consent-token:v1", 32));
}

function sign(body: string, key: Buffer) {
  return createHmac("sha256", key).update(body).digest("base64url");
}

export function createConsentToken(
  input: { parentId: string; version: string; now?: number },
  key: Buffer,
) {
  const nowSeconds = Math.floor((input.now ?? Date.now()) / 1000);
  const body = Buffer.from(
    JSON.stringify({
      p: input.parentId,
      v: input.version,
      e: nowSeconds + CONSENT_TOKEN_TTL_SECONDS,
    }),
  ).toString("base64url");
  return `${body}.${sign(body, key)}`;
}

export function verifyConsentToken(
  token: string,
  key: Buffer,
  options: { currentVersion: string; now?: number },
): ConsentTokenResult {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: "malformed" };
  const [body, signature] = parts;

  const expected = Buffer.from(sign(body, key));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, reason: "bad-signature" };
  }

  let parsed: z.infer<typeof payloadSchema>;
  try {
    parsed = payloadSchema.parse(JSON.parse(Buffer.from(body, "base64url").toString("utf8")));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (parsed.e * 1000 <= (options.now ?? Date.now())) return { ok: false, reason: "expired" };
  if (parsed.v !== options.currentVersion) return { ok: false, reason: "wrong-version" };

  return { ok: true, payload: { parentId: parsed.p, version: parsed.v, expiresAt: parsed.e } };
}
