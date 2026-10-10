import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  CONSENT_TOKEN_TTL_SECONDS,
  createConsentToken,
  deriveConsentTokenKey,
  verifyConsentToken,
} from "./consent-token";

const key = deriveConsentTokenKey("rahasia-server-uji");
const otherKey = deriveConsentTokenKey("rahasia-lain");
const parentId = "5eed0000-0000-4000-8000-000000000011";
const now = Date.UTC(2026, 9, 10, 8, 0, 0);
const version = "persetujuan-v1-2026-10";

describe("token persetujuan", () => {
  it("token yang dibuat server lolos verifikasi dan membawa id orang tua serta versinya", () => {
    const token = createConsentToken({ parentId, version, now }, key);
    expect(token).toMatch(/^[\w-]+\.[\w-]+$/);
    expect(verifyConsentToken(token, key, { currentVersion: version, now })).toEqual({
      ok: true,
      payload: { parentId, version, expiresAt: now / 1000 + CONSENT_TOKEN_TTL_SECONDS },
    });
  });

  it("NEGATIF: kedaluwarsa setelah 7 hari", () => {
    const token = createConsentToken({ parentId, version, now }, key);
    const later = now + CONSENT_TOKEN_TTL_SECONDS * 1000;
    expect(verifyConsentToken(token, key, { currentVersion: version, now: later })).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("NEGATIF: ditolak bila teks persetujuan sudah berganti versi", () => {
    const token = createConsentToken({ parentId, version, now }, key);
    expect(
      verifyConsentToken(token, key, { currentVersion: "persetujuan-v2-2027-01", now }),
    ).toEqual({ ok: false, reason: "wrong-version" });
  });

  it("NEGATIF: isi yang diubah (mis. id orang tua lain) membuat tanda tangan tidak cocok", () => {
    const token = createConsentToken({ parentId, version, now }, key);
    const [, signature] = token.split(".");
    const forgedBody = Buffer.from(
      JSON.stringify({ p: "5eed0000-0000-4000-8000-000000000012", v: version, e: 9_999_999_999 }),
    ).toString("base64url");
    expect(
      verifyConsentToken(`${forgedBody}.${signature}`, key, { currentVersion: version, now }),
    ).toEqual({ ok: false, reason: "bad-signature" });
  });

  it("NEGATIF: token dari kunci lain ditolak", () => {
    const token = createConsentToken({ parentId, version, now }, otherKey);
    expect(verifyConsentToken(token, key, { currentVersion: version, now })).toMatchObject({
      ok: false,
      reason: "bad-signature",
    });
  });

  it("NEGATIF: token rusak ditolak tanpa melempar galat", () => {
    for (const token of ["", "demo-persetujuan", "a.b.c", ".", "abc.", ".abc"]) {
      const result = verifyConsentToken(token, key, { currentVersion: version, now });
      expect(result.ok).toBe(false);
    }
  });

  it("NEGATIF: isi bertanda tangan sah tetapi bukan uuid ditolak", () => {
    const body = Buffer.from(
      JSON.stringify({ p: "bukan-uuid", v: version, e: 9_999_999_999 }),
    ).toString("base64url");
    const signature = createHmac("sha256", key).update(body).digest("base64url");
    expect(
      verifyConsentToken(`${body}.${signature}`, key, { currentVersion: version, now }),
    ).toEqual({ ok: false, reason: "malformed" });
  });

  it("kunci diturunkan secara tetap dan tidak sama dengan rahasia aslinya", () => {
    expect(deriveConsentTokenKey("abc").equals(deriveConsentTokenKey("abc"))).toBe(true);
    expect(deriveConsentTokenKey("abc").equals(deriveConsentTokenKey("abd"))).toBe(false);
    expect(deriveConsentTokenKey("abc").toString("utf8")).not.toContain("abc");
    expect(() => deriveConsentTokenKey("")).toThrow();
  });
});
