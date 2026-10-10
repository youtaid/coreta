import { z } from "zod";

import { examGoals } from "@/lib/auth/schemas";
import { uuidLike } from "@/lib/ids";

/** Sama dengan PIN_LENGTH dan isWeakPin di @coreta/db; diulang di sini agar aman dipakai di peramban. */
const pin = z
  .string({ error: "PIN wajib diisi." })
  .regex(/^\d{6}$/, "PIN harus 6 angka.")
  .refine((value) => {
    const digits = [...value].map(Number);
    const steps = new Set(digits.slice(1).map((digit, index) => digit - digits[index]));
    return !(steps.size === 1 && [0, 1, -1].includes([...steps][0]));
  }, "PIN terlalu mudah ditebak. Hindari angka sama atau berurutan.");

const pinConfirm = z.string({ error: "Ulangi PIN." });

function pinsMatch(value: { pin: string; pinConfirm: string }) {
  return value.pin === value.pinConfirm;
}
const pinMismatch = { path: ["pinConfirm"], message: "PIN tidak sama." };

const dailyTarget = z.coerce
  .number({ error: "Target harian harus angka." })
  .int("Target harian harus bilangan bulat.")
  .min(1, "Target harian minimal 1 soal.")
  .max(20, "Target harian maksimal 20 soal.");

const goal = z.enum(examGoals, { error: "Pilih target ujian." });

export const studentGrades = ["10", "11", "12"] as const;

export const createStudentSchema = z
  .object({
    fullName: z
      .string({ error: "Nama anak wajib diisi." })
      .trim()
      .min(1, "Nama anak wajib diisi.")
      .max(80, "Nama terlalu panjang."),
    grade: z.enum(studentGrades, { error: "Pilih kelas." }).transform(Number),
    goal,
    dailyTarget,
    pin,
    pinConfirm,
  })
  .refine(pinsMatch, pinMismatch);

export const updateTargetsSchema = z.object({
  studentId: uuidLike("Anak tidak ditemukan."),
  goal,
  dailyTarget,
});

export const resetPinSchema = z
  .object({ studentId: uuidLike("Anak tidak ditemukan."), pin, pinConfirm })
  .refine(pinsMatch, pinMismatch);

export const studentSignInSchema = z.object({
  code: z.string({ error: "Kode masuk wajib diisi." }).trim().min(1, "Kode masuk wajib diisi."),
  pin: z.string({ error: "PIN wajib diisi." }).regex(/^\d{6}$/, "PIN harus 6 angka."),
  next: z.string().optional(),
});
