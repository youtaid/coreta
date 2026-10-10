import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claims: null as Record<string, unknown> | null,
  recordConsent: vi.fn(),
  readConsentToken: vi.fn(),
  revokeChildSessions: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getClaims: async () => ({ data: mocks.claims ? { claims: mocks.claims } : null }),
    },
  }),
}));

vi.mock("@/lib/auth/consent-server", () => ({
  recordConsent: mocks.recordConsent,
  readConsentToken: mocks.readConsentToken,
  revokeChildSessions: mocks.revokeChildSessions,
}));

import { POST } from "./route";

const parentId = "5eed0000-0000-4000-8000-000000000011";

// Seperti di `next start`: request.url memakai alamat internal server, sedangkan peramban membuka
// situs lewat 127.0.0.1 dan mengirim Host serta Origin sesuai alamat itu.
function request(body: unknown, origin: string | null = "http://127.0.0.1:3000") {
  return new Request("http://localhost:3000/api/consent", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "127.0.0.1:3000",
      ...(origin ? { origin } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const savedRow = {
  parent_id: parentId,
  type: "data_anak",
  granted: true,
  version: "persetujuan-v1-2026-10",
  granted_at: "2026-10-10T08:00:00Z",
};

beforeEach(() => {
  mocks.claims = null;
  mocks.recordConsent.mockReset().mockResolvedValue({ data: savedRow, error: null });
  mocks.readConsentToken.mockReset();
  mocks.revokeChildSessions.mockReset().mockResolvedValue(1);
});

describe("POST /api/consent", () => {
  it("orang tua yang masuk mencatat persetujuannya; versi diisi server", async () => {
    mocks.claims = { sub: parentId, app_metadata: { role: "parent" } };
    const response = await POST(request({ granted: true, version: "versi-palsu" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      consent: {
        type: "data_anak",
        granted: true,
        version: "persetujuan-v1-2026-10",
        grantedAt: "2026-10-10T08:00:00Z",
      },
    });
    expect(mocks.recordConsent).toHaveBeenCalledWith({
      parentId,
      type: "data_anak",
      granted: true,
      actorId: parentId,
      source: "sesi",
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("tautan bertoken mencatat untuk orang tua di dalam token, tanpa perlu masuk", async () => {
    mocks.readConsentToken.mockReturnValue({
      ok: true,
      payload: { parentId, version: "persetujuan-v1-2026-10", expiresAt: 1 },
    });
    const response = await POST(request({ token: "tok.sig", granted: false }));
    expect(response.status).toBe(200);
    expect(mocks.recordConsent).toHaveBeenCalledWith(
      expect.objectContaining({ parentId, granted: false, actorId: parentId, source: "token" }),
    );
  });

  it("menolak persetujuan data anak mencabut sesi anak; persetujuan riset tidak", async () => {
    mocks.claims = { sub: parentId, app_metadata: { role: "parent" } };
    await POST(request({ granted: false }));
    expect(mocks.revokeChildSessions).toHaveBeenCalledWith(parentId);
    mocks.revokeChildSessions.mockClear();
    await POST(request({ granted: false, type: "riset" }));
    await POST(request({ granted: true }));
    expect(mocks.revokeChildSessions).not.toHaveBeenCalled();
  });

  it("NEGATIF: tanpa sesi dan tanpa token ditolak 401", async () => {
    const response = await POST(request({ granted: true }));
    expect(response.status).toBe(401);
    expect(mocks.recordConsent).not.toHaveBeenCalled();
  });

  it("NEGATIF: siswa dan admin tidak bisa memberi persetujuan", async () => {
    for (const role of ["student", "admin"]) {
      mocks.claims = { sub: "5eed0000-0000-4000-8000-000000000021", app_metadata: { role } };
      const response = await POST(request({ granted: true }));
      expect(response.status).toBe(403);
    }
    expect(mocks.recordConsent).not.toHaveBeenCalled();
  });

  it("NEGATIF: token tidak sah atau kedaluwarsa ditolak 410", async () => {
    mocks.readConsentToken.mockReturnValue({ ok: false, reason: "bad-signature" });
    let response = await POST(request({ token: "palsu", granted: true }));
    expect(response.status).toBe(410);
    expect((await response.json()).error).toBe("Tautan persetujuan tidak valid.");

    mocks.readConsentToken.mockReturnValue({ ok: false, reason: "expired" });
    response = await POST(request({ token: "lama", granted: true }));
    expect((await response.json()).error).toMatch(/kedaluwarsa/);
    expect(mocks.recordConsent).not.toHaveBeenCalled();
  });

  it("Origin yang sama dengan Host diterima walaupun request.url memakai alamat internal", async () => {
    mocks.claims = { sub: parentId, app_metadata: { role: "parent" } };
    const response = await POST(request({ granted: true }));
    expect(response.status).toBe(200);
  });

  it("NEGATIF: permintaan dari situs lain ditolak 403 (CSRF)", async () => {
    mocks.claims = { sub: parentId, app_metadata: {} };
    const response = await POST(request({ granted: true }, "https://evil.example"));
    expect(response.status).toBe(403);
    expect(mocks.recordConsent).not.toHaveBeenCalled();
  });

  it("NEGATIF: isi tidak valid ditolak 400", async () => {
    mocks.claims = { sub: parentId, app_metadata: {} };
    for (const body of ["bukan json", { granted: "ya" }, { granted: true, type: "jualan" }]) {
      const response = await POST(request(body));
      expect(response.status).toBe(400);
    }
  });

  it("galat basis data tidak bocor ke klien", async () => {
    mocks.claims = { sub: parentId, app_metadata: {} };
    mocks.recordConsent.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "detail internal" },
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(request({ granted: true }));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("detail internal");
    spy.mockRestore();
  });

  it("NEGATIF: akun yang bukan orang tua ditolak oleh basis data (22023) menjadi 403", async () => {
    mocks.readConsentToken.mockReturnValue({
      ok: true,
      payload: { parentId, version: "persetujuan-v1-2026-10", expiresAt: 1 },
    });
    mocks.recordConsent.mockResolvedValue({ data: null, error: { code: "22023" } });
    const response = await POST(request({ token: "tok.sig", granted: true }));
    expect(response.status).toBe(403);
  });
});
