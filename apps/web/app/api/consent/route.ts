import { z } from "zod";

import { recordConsent, readConsentToken, revokeChildSessions } from "@/lib/auth/consent-server";
import { roleFromClaims } from "@/lib/auth/roles";
import { consentTypes } from "@/lib/consent";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

const bodySchema = z.object({
  /** Token dari tautan /persetujuan/[token]. Tanpa token, persetujuan memakai sesi orang tua. */
  token: z.string().min(1).max(2048).optional(),
  type: z.enum(consentTypes).default("data_anak"),
  granted: z.boolean(),
});

function fail(status: number, error: string) {
  return Response.json({ ok: false, error }, { status, headers });
}

/**
 * Tolak permintaan dari situs lain (CSRF); peramban selalu mengirim Origin pada POST. Dibandingkan
 * dengan header Host yang dikirim peramban, bukan request.url: di balik `next start` atau proxy,
 * request.url bisa berisi alamat internal server (mis. localhost) yang berbeda dari alamat publik.
 */
function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * POST /api/consent: mencatat keputusan orang tua (setuju atau tolak) beserta versi teks yang
 * berlaku dan waktunya (dicap trigger). Ditulis dengan service_role lewat record_consent, yang
 * juga mencatat audit_log. Klien tidak pernah menulis consents langsung (migrasi 0006).
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail(403, "Permintaan dari situs lain ditolak.");

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return fail(400, "Isi permintaan tidak valid.");
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const sessionUserId = typeof auth?.claims.sub === "string" ? auth.claims.sub : null;

  let parentId: string;
  if (body.token) {
    const token = readConsentToken(body.token);
    if (!token.ok) {
      return fail(
        410,
        token.reason === "expired" || token.reason === "wrong-version"
          ? "Tautan persetujuan sudah kedaluwarsa. Minta tautan baru."
          : "Tautan persetujuan tidak valid.",
      );
    }
    parentId = token.payload.parentId;
  } else {
    if (!sessionUserId) return fail(401, "Silakan masuk terlebih dahulu.");
    if (roleFromClaims(auth?.claims) !== "ortu") {
      return fail(403, "Hanya orang tua atau wali yang dapat memberi persetujuan.");
    }
    parentId = sessionUserId;
  }

  const { data, error } = await recordConsent({
    parentId,
    type: body.type,
    granted: body.granted,
    actorId: sessionUserId ?? parentId,
    source: body.token ? "token" : "sesi",
  });

  if (error) {
    if (error.code === "22023") {
      return fail(403, "Hanya orang tua atau wali yang dapat memberi persetujuan.");
    }
    console.error("[consent] gagal mencatat persetujuan", error);
    return fail(500, "Persetujuan belum tersimpan. Coba lagi sebentar lagi.");
  }

  if (!body.granted && body.type === "data_anak") {
    try {
      await revokeChildSessions(parentId);
    } catch (revokeError) {
      // Persetujuan sudah tercatat; masuk berikutnya tetap ditolak. Sesi lama habis sendiri.
      console.error("[consent] sesi anak gagal dicabut", revokeError);
    }
  }

  return Response.json(
    {
      ok: true,
      consent: {
        type: data.type,
        granted: data.granted,
        version: data.version,
        grantedAt: data.granted_at,
      },
    },
    { headers },
  );
}
