import { beforeEach, describe, expect, it, vi } from "vitest";

const parentA = "5eed0000-0000-4000-8000-000000000011";
const childOfB = "5eed0000-0000-4000-8000-000000000032";

const mocks = vi.hoisted(() => ({
  filters: [] as [string, string][],
  linkRow: null as unknown,
  studentRow: null as unknown,
  locked: null as string | null,
  noteResult: null as string | null,
  rpc: vi.fn(),
  updateUserById: vi.fn(),
  signInWithPassword: vi.fn(),
  hasConsent: true,
  createUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getStudentPinPepper: () => "pepper-uji-minimal-16" }));
vi.mock("@/lib/auth/consent-server", () => ({ hasCurrentConsent: async () => mocks.hasConsent }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signInWithPassword: mocks.signInWithPassword, signOut: vi.fn() },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    const query = {
      select: () => query,
      eq: (column: string, value: string) => {
        mocks.filters.push([column, value]);
        return query;
      },
      maybeSingle: async () => ({
        data: mocks.filters.some(([column]) => column === "login_code")
          ? mocks.studentRow
          : mocks.linkRow,
        error: null,
      }),
      insert: async () => ({ error: null }),
    };
    return {
      from: () => query,
      rpc: async (name: string, args: Record<string, unknown>) => {
        mocks.rpc(name, args);
        if (name === "login_locked_until") return { data: mocks.locked, error: null };
        if (name === "note_login_failure") return { data: mocks.noteResult, error: null };
        if (name === "register_student") return { data: { id: "siswa-baru" }, error: null };
        return { data: null, error: null };
      },
      auth: {
        admin: {
          getUserById: async () => ({ data: { user: { email: "siswa@siswa.coreta.invalid" } } }),
          updateUserById: mocks.updateUserById,
          createUser: mocks.createUser,
          deleteUser: mocks.deleteUser,
        },
      },
    };
  },
}));

import { createStudentAccount, resetStudentPin, signInStudent } from "./student-server";

const rpcNames = () => mocks.rpc.mock.calls.map(([name]) => name);

beforeEach(() => {
  mocks.filters = [];
  mocks.linkRow = null;
  mocks.studentRow = null;
  mocks.locked = null;
  mocks.noteResult = null;
  mocks.hasConsent = true;
  for (const fn of [
    mocks.rpc,
    mocks.updateUserById,
    mocks.signInWithPassword,
    mocks.createUser,
    mocks.deleteUser,
  ]) {
    fn.mockReset();
  }
  mocks.updateUserById.mockResolvedValue({ error: null });
  mocks.createUser.mockResolvedValue({ error: null });
});

describe("resetStudentPin", () => {
  it("NEGATIF: mencari anak HANYA di antara anak orang tua dari sesi", async () => {
    const result = await resetStudentPin({ parentId: parentA, studentId: childOfB, pin: "573804" });
    expect(mocks.filters).toContainEqual(["parent_id", parentA]);
    expect(mocks.filters).toContainEqual(["student_id", childOfB]);
    expect(result).toEqual({ ok: false, reason: "not-found" });
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it("mengganti kata sandi turunan, mencatat audit, dan membuka kunci kode", async () => {
    mocks.linkRow = { students: { profile_id: "p-anak", login_code: "RAKA4826" } };
    const result = await resetStudentPin({ parentId: parentA, studentId: "s", pin: "573804" });
    expect(result).toEqual({ ok: true });
    const [, attributes] = mocks.updateUserById.mock.calls[0];
    expect(attributes.password).toMatch(/^pin1\./);
    expect(attributes.password).not.toContain("573804");
    expect(mocks.rpc).toHaveBeenCalledWith("clear_login_failures", {
      throttle_key: "kode:RAKA4826",
    });
  });
});

describe("signInStudent", () => {
  it("NEGATIF: kode yang terkunci tidak dicoba ke Supabase Auth sama sekali", async () => {
    mocks.locked = "2026-10-10T10:00:00Z";
    const result = await signInStudent({ code: "RAKA-4826", pin: "482913", ip: "1.2.3.4" });
    expect(result).toEqual({ ok: false, reason: "locked", lockedUntil: "2026-10-10T10:00:00Z" });
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("NEGATIF: kode tak dikenal dicatat gagal per kode dan per IP, jawabannya sama", async () => {
    const result = await signInStudent({ code: "ZZZZ-9999", pin: "482913", ip: "1.2.3.4" });
    expect(result).toEqual({ ok: false, reason: "invalid" });
    const keys = mocks.rpc.mock.calls
      .filter(([name]) => name === "note_login_failure")
      .map(([, args]) => args.throttle_key);
    expect(keys).toEqual(["kode:ZZZZ9999", "ip:1.2.3.4"]);
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("PIN salah: gagal dicatat; kegagalan kelima mengunci", async () => {
    mocks.studentRow = { profile_id: "p-anak" };
    mocks.signInWithPassword.mockResolvedValue({
      data: {},
      error: { code: "invalid_credentials" },
    });
    mocks.noteResult = "2026-10-10T10:15:00Z";
    const result = await signInStudent({ code: "RAKA4826", pin: "999888", ip: null });
    expect(result).toEqual({ ok: false, reason: "locked", lockedUntil: "2026-10-10T10:15:00Z" });
  });

  it("berhasil: kata sandi turunan dipakai dan catatan gagal dihapus", async () => {
    mocks.studentRow = { profile_id: "p-anak" };
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: { app_metadata: { role: "student" } } },
      error: null,
    });
    expect(await signInStudent({ code: "raka-4826", pin: "482913", ip: null })).toEqual({
      ok: true,
    });
    expect(mocks.signInWithPassword.mock.calls[0][0].password).toMatch(/^pin1\./);
    expect(rpcNames()).toContain("clear_login_failures");
  });

  it("NEGATIF: akun yang bukan siswa tidak boleh masuk lewat kode", async () => {
    mocks.studentRow = { profile_id: "p" };
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: { app_metadata: {} } },
      error: null,
    });
    expect((await signInStudent({ code: "RAKA4826", pin: "482913", ip: null })).ok).toBe(false);
  });
});

describe("createStudentAccount", () => {
  const input = {
    parentId: parentA,
    fullName: "Ayu",
    grade: 10,
    goal: "tka" as const,
    dailyTarget: 7,
    pin: "739182",
  };

  it("NEGATIF: tanpa persetujuan, pengguna Auth tidak dibuat", async () => {
    mocks.hasConsent = false;
    expect(await createStudentAccount(input)).toEqual({ ok: false, reason: "no-consent" });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("membuat pengguna Auth siswa (email .invalid, peran dari app_metadata) lalu register_student", async () => {
    const result = await createStudentAccount(input);
    expect(result).toMatchObject({ ok: true, studentId: "siswa-baru" });
    const [attributes] = mocks.createUser.mock.calls[0];
    expect(attributes.email).toBe(`siswa.${attributes.id}@siswa.coreta.invalid`);
    expect(attributes.app_metadata).toEqual({ role: "student" });
    expect(attributes.password).toMatch(/^pin1\./);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "register_student",
      expect.objectContaining({ target_parent: parentA, student_profile: attributes.id }),
    );
  });
});
