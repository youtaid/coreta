import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: null as { id: string; role: string } | null,
  createStudentAccount: vi.fn(),
  resetStudentPin: vi.fn(),
  updatedRows: [] as { id: string }[],
  update: vi.fn(),
  eq: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session-server", () => ({ currentUser: async () => mocks.user }));
vi.mock("@/lib/auth/student-server", () => ({
  createStudentAccount: mocks.createStudentAccount,
  resetStudentPin: mocks.resetStudentPin,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      update: (values: unknown) => {
        mocks.update(values);
        return {
          eq: (column: string, value: string) => {
            mocks.eq(column, value);
            return { select: async () => ({ data: mocks.updatedRows, error: null }) };
          },
        };
      },
    }),
  }),
}));

import { createStudent, resetPin, updateTargets } from "./actions";

const parentA = "5eed0000-0000-4000-8000-000000000011";
const childOfB = "5eed0000-0000-4000-8000-000000000032";
const idle = { status: "idle" as const };

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const newChild = {
  fullName: "Ayu",
  grade: "10",
  goal: "tka",
  dailyTarget: "7",
  pin: "482913",
  pinConfirm: "482913",
};

beforeEach(() => {
  mocks.user = { id: parentA, role: "ortu" };
  mocks.createStudentAccount.mockReset();
  mocks.resetStudentPin.mockReset();
  mocks.update.mockReset();
  mocks.eq.mockReset();
  mocks.updatedRows = [];
});

describe("createStudent", () => {
  it("membuat akun untuk orang tua yang sedang masuk dan menampilkan kode masuknya", async () => {
    mocks.createStudentAccount.mockResolvedValue({
      ok: true,
      studentId: "s",
      loginCode: "K7QM-3XPA",
    });
    const state = await createStudent(idle, form({ ...newChild, parentId: childOfB }));
    expect(mocks.createStudentAccount).toHaveBeenCalledWith({
      parentId: parentA,
      fullName: "Ayu",
      grade: 10,
      goal: "tka",
      dailyTarget: 7,
      pin: "482913",
      pinConfirm: "482913",
    });
    expect(state).toMatchObject({
      status: "success",
      created: { name: "Ayu", loginCode: "K7QM-3XPA" },
    });
  });

  it("NEGATIF: siswa, admin, dan tamu tidak bisa membuat akun siswa", async () => {
    for (const user of [{ id: "s", role: "siswa" }, { id: "a", role: "admin" }, null]) {
      mocks.user = user;
      expect((await createStudent(idle, form(newChild))).status).toBe("error");
    }
    expect(mocks.createStudentAccount).not.toHaveBeenCalled();
  });

  it("NEGATIF: tanpa persetujuan data anak, akun tidak dibuat", async () => {
    mocks.createStudentAccount.mockResolvedValue({ ok: false, reason: "no-consent" });
    const state = await createStudent(idle, form(newChild));
    expect(state.message).toMatch(/Setujui dulu/);
  });

  it("NEGATIF: PIN lemah ditolak sebelum menyentuh server Auth", async () => {
    const state = await createStudent(
      idle,
      form({ ...newChild, pin: "111111", pinConfirm: "111111" }),
    );
    expect(state.errors?.pin).toMatch(/mudah ditebak/);
    expect(mocks.createStudentAccount).not.toHaveBeenCalled();
  });
});

describe("updateTargets", () => {
  it("menyimpan lewat sesi orang tua (RLS)", async () => {
    mocks.updatedRows = [{ id: childOfB }];
    const state = await updateTargets(
      idle,
      form({ studentId: childOfB, goal: "both", dailyTarget: "9" }),
    );
    expect(mocks.update).toHaveBeenCalledWith({ goal: "both", daily_target: 9 });
    expect(mocks.eq).toHaveBeenCalledWith("id", childOfB);
    expect(state.status).toBe("success");
  });

  it("NEGATIF: anak orang tua lain = 0 baris dari RLS = 'Anak tidak ditemukan'", async () => {
    mocks.updatedRows = [];
    const state = await updateTargets(
      idle,
      form({ studentId: childOfB, goal: "tka", dailyTarget: "1" }),
    );
    expect(state).toEqual({ status: "error", message: "Anak tidak ditemukan." });
  });
});

describe("resetPin", () => {
  it("memeriksa hubungan wali lewat orang tua dari sesi, bukan isian", async () => {
    mocks.resetStudentPin.mockResolvedValue({ ok: false, reason: "not-found" });
    const state = await resetPin(
      idle,
      form({ studentId: childOfB, pin: "573804", pinConfirm: "573804", parentId: childOfB }),
    );
    expect(mocks.resetStudentPin).toHaveBeenCalledWith({
      parentId: parentA,
      studentId: childOfB,
      pin: "573804",
    });
    expect(state.message).toBe("Anak tidak ditemukan.");
  });
});
