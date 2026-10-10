import { beforeEach, describe, expect, it, vi } from "vitest";

const parentA = "5eed0000-0000-4000-8000-000000000011";
const childOfB = "5eed0000-0000-4000-8000-000000000032";

const mocks = vi.hoisted(() => ({
  filters: [] as [string, string, unknown][],
  linkRow: null as unknown,
  studentRow: null as unknown,
  guardianRows: [] as { parent_id: string }[],
  consentRows: [] as { parent_id: string }[],
  locked: {} as Record<string, string | null>,
  reserve: {} as Record<string, string | null>,
  rpc: vi.fn(),
  updateUserById: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  hasConsent: true,
  createUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ getStudentPinPepper: () => "pepper-uji-minimal-16" }));
vi.mock("@/lib/auth/consent-server", () => ({ hasCurrentConsent: async () => mocks.hasConsent }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signInWithPassword: mocks.signInWithPassword, signOut: mocks.signOut },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    const queryFor = (table: string) => {
      const listData = () =>
        table === "guardianships"
          ? mocks.guardianRows
          : table === "consents"
            ? mocks.consentRows
            : [];
      const query = {
        select: () => query,
        eq: (column: string, value: string) => {
          mocks.filters.push([table, column, value]);
          return query;
        },
        in: () => query,
        limit: () => query,
        maybeSingle: async () => ({
          data: table === "students" ? mocks.studentRow : mocks.linkRow,
          error: null,
        }),
        insert: async () => ({ error: null }),
        then: (resolve: (value: unknown) => unknown) => resolve({ data: listData(), error: null }),
      };
      return query;
    };
    return {
      from: queryFor,
      rpc: async (name: string, args: { throttle_key?: string }) => {
        mocks.rpc(name, args);
        if (name === "login_locked_until")
          return { data: mocks.locked[args.throttle_key!] ?? null, error: null };
        if (name === "note_login_failure")
          return { data: mocks.reserve[args.throttle_key!] ?? null, error: null };
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

const reservedKeys = () =>
  mocks.rpc.mock.calls
    .filter(([name]) => name === "note_login_failure")
    .map(([, args]) => args.throttle_key);

beforeEach(() => {
  mocks.filters = [];
  mocks.linkRow = null;
  mocks.studentRow = null;
  mocks.guardianRows = [{ parent_id: parentA }];
  mocks.consentRows = [{ parent_id: parentA }];
  mocks.locked = {};
  mocks.reserve = {};
  mocks.hasConsent = true;
  for (const fn of [
    mocks.rpc,
    mocks.updateUserById,
    mocks.signInWithPassword,
    mocks.signOut,
    mocks.createUser,
    mocks.deleteUser,
  ]) {
    fn.mockReset();
  }
  mocks.updateUserById.mockResolvedValue({ error: null });
  mocks.createUser.mockResolvedValue({ error: null });
  mocks.deleteUser.mockResolvedValue({ error: null });
});

describe("resetStudentPin", () => {
  it("NEGATIF: mencari anak HANYA di antara anak orang tua dari sesi", async () => {
    const result = await resetStudentPin({ parentId: parentA, studentId: childOfB, pin: "573804" });
    expect(mocks.filters).toContainEqual(["guardianships", "parent_id", parentA]);
    expect(mocks.filters).toContainEqual(["guardianships", "student_id", childOfB]);
    expect(result).toEqual({ ok: false, reason: "not-found" });
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it("mengganti kata sandi turunan, mencabut sesi lama, mencatat audit, dan membuka kunci kode", async () => {
    mocks.linkRow = { students: { profile_id: "p-anak", login_code: "RAKA4826" } };
    const result = await resetStudentPin({ parentId: parentA, studentId: "s", pin: "573804" });
    expect(result).toEqual({ ok: true });
    const [, attributes] = mocks.updateUserById.mock.calls[0];
    expect(attributes.password).toMatch(/^pin1\./);
    expect(attributes.password).not.toContain("573804");
    expect(mocks.rpc).toHaveBeenCalledWith("clear_login_failures", {
      throttle_key: "kode:RAKA4826",
    });
    expect(mocks.rpc).toHaveBeenCalledWith("revoke_user_sessions", { target_user: "p-anak" });
  });
});

describe("signInStudent", () => {
  const student = { id: "s-anak", profile_id: "p-anak" };
  const signedIn = (role = "student") =>
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: { app_metadata: { role } } },
      error: null,
    });

  it("NEGATIF: kode yang terkunci tidak dicoba ke Supabase Auth sama sekali", async () => {
    mocks.locked["kode:RAKA4826"] = "2026-10-10T10:00:00Z";
    const result = await signInStudent({ code: "RAKA-4826", pin: "482913", ip: "1.2.3.4" });
    expect(result).toEqual({
      ok: false,
      reason: "locked",
      lockedUntil: "2026-10-10T10:00:00Z",
      scope: "code",
    });
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("NEGATIF: kunci per IP diberitahukan sebagai kunci jaringan, bukan kunci kode", async () => {
    mocks.locked["ip:1.2.3.4"] = "2026-10-10T10:00:00Z";
    const result = await signInStudent({ code: "RAKA-4826", pin: "482913", ip: "1.2.3.4" });
    expect(result).toMatchObject({ reason: "locked", scope: "ip" });
  });

  it("percobaan dipesan SEBELUM PIN diuji (permintaan paralel tidak melewati batas)", async () => {
    mocks.studentRow = student;
    mocks.signInWithPassword.mockImplementation(async () => {
      expect(reservedKeys()).toEqual(["kode:RAKA4826", "ip:1.2.3.4"]);
      return { data: {}, error: { status: 400, code: "invalid_credentials" } };
    });
    expect(await signInStudent({ code: "RAKA4826", pin: "999888", ip: "1.2.3.4" })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(mocks.signInWithPassword).toHaveBeenCalledTimes(1);
  });

  it("NEGATIF: pemesanan yang melewati batas mengunci tanpa menguji PIN", async () => {
    mocks.studentRow = student;
    mocks.reserve["kode:RAKA4826"] = "2026-10-10T10:15:00Z";
    const result = await signInStudent({ code: "RAKA4826", pin: "482913", ip: null });
    expect(result).toEqual({
      ok: false,
      reason: "locked",
      lockedUntil: "2026-10-10T10:15:00Z",
      scope: "code",
    });
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("NEGATIF: kode tak dikenal dijawab sama dengan PIN salah", async () => {
    expect(await signInStudent({ code: "ZZZZ-9999", pin: "482913", ip: null })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("batas laju (429) atau gangguan (5xx) Supabase tidak disebut PIN salah", async () => {
    mocks.studentRow = student;
    for (const status of [429, 500, 503]) {
      mocks.signInWithPassword.mockResolvedValue({ data: {}, error: { status } });
      expect(await signInStudent({ code: "RAKA4826", pin: "482913", ip: null })).toEqual({
        ok: false,
        reason: "busy",
      });
    }
  });

  it("berhasil: kata sandi turunan dipakai, catatan kode dihapus", async () => {
    mocks.studentRow = student;
    signedIn();
    expect(await signInStudent({ code: "raka-4826", pin: "482913", ip: null })).toEqual({
      ok: true,
    });
    expect(mocks.signInWithPassword.mock.calls[0][0].password).toMatch(/^pin1\./);
    expect(mocks.rpc).toHaveBeenCalledWith("clear_login_failures", {
      throttle_key: "kode:RAKA4826",
    });
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("NEGATIF: tanpa persetujuan wali yang berlaku, sesi langsung diakhiri", async () => {
    mocks.studentRow = student;
    mocks.consentRows = [];
    signedIn();
    expect(await signInStudent({ code: "RAKA4826", pin: "482913", ip: null })).toEqual({
      ok: false,
      reason: "no-consent",
    });
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });

  it("NEGATIF: siswa tanpa wali sama sekali juga ditolak", async () => {
    mocks.studentRow = student;
    mocks.guardianRows = [];
    signedIn();
    expect((await signInStudent({ code: "RAKA4826", pin: "482913", ip: null })).ok).toBe(false);
  });

  it("NEGATIF: akun yang bukan siswa tidak boleh masuk lewat kode", async () => {
    mocks.studentRow = student;
    signedIn("parent");
    expect(await signInStudent({ code: "RAKA4826", pin: "482913", ip: null })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(mocks.signOut).toHaveBeenCalled();
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
