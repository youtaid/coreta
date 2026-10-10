import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: null as { id: string; app_metadata: Record<string, unknown> } | null,
  signOut: vi.fn(),
  destination: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: async () =>
        mocks.user
          ? { data: { user: mocks.user }, error: null }
          : { data: {}, error: { code: "x" } },
      verifyOtp: async () =>
        mocks.user
          ? { data: { user: mocks.user }, error: null }
          : { data: {}, error: { code: "x" } },
      signOut: mocks.signOut,
    },
  }),
}));
vi.mock("@/lib/auth/session-server", () => ({ destinationAfterSignIn: mocks.destination }));

import { GET } from "./route";

const call = (query: string) => GET(new NextRequest(`http://127.0.0.1:3000/auth/callback${query}`));
const target = (response: Response) => {
  const url = new URL(response.headers.get("location") ?? "");
  return `${url.pathname}${url.search}`;
};

beforeEach(() => {
  mocks.user = null;
  mocks.signOut.mockReset();
  mocks.destination.mockReset().mockResolvedValue({ role: "ortu", to: "/ortu/laporan" });
});

describe("GET /auth/callback", () => {
  it("orang tua dari Google diarahkan sesuai peran", async () => {
    mocks.user = { id: "p", app_metadata: { role: "parent", provider: "google" } };
    const response = await call("?code=abc&next=/ortu/anak");
    expect(target(response)).toBe("/ortu/laporan");
    expect(mocks.destination).toHaveBeenCalledWith(mocks.user, "/ortu/anak");
  });

  it("NEGATIF: akun siswa tidak bisa masuk lewat Google atau tautan email", async () => {
    mocks.user = { id: "s", app_metadata: { role: "student", providers: ["email", "google"] } };
    for (const query of ["?code=abc", "?token_hash=t&type=email"]) {
      const response = await call(query);
      expect(target(response)).toBe("/masuk?galat=siswa");
    }
    expect(mocks.signOut).toHaveBeenCalledTimes(2);
    expect(mocks.destination).not.toHaveBeenCalled();
  });

  it("NEGATIF: kode atau token tidak sah kembali ke /masuk", async () => {
    for (const query of ["?code=salah", "?token_hash=t&type=bukan", ""]) {
      const response = await call(query);
      expect(target(response)).toBe("/masuk?galat=tautan");
    }
  });
});
