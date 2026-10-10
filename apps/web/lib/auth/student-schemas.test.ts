import { isWeakPin } from "@coreta/db";
import { describe, expect, it } from "vitest";

import { fieldErrors } from "./schemas";
import {
  createStudentSchema,
  resetPinSchema,
  studentSignInSchema,
  updateTargetsSchema,
} from "./student-schemas";

const valid = {
  fullName: " Raka ",
  grade: "11",
  goal: "utbk",
  dailyTarget: "8",
  pin: "482913",
  pinConfirm: "482913",
};

describe("createStudentSchema", () => {
  it("merapikan isian yang sah", () => {
    expect(createStudentSchema.parse(valid)).toEqual({
      fullName: "Raka",
      grade: 11,
      goal: "utbk",
      dailyTarget: 8,
      pin: "482913",
      pinConfirm: "482913",
    });
  });

  it("NEGATIF: PIN lemah, PIN tidak sama, target di luar batas", () => {
    expect(
      fieldErrors(
        createStudentSchema.safeParse({ ...valid, pin: "123456", pinConfirm: "123456" }).error!,
      ).pin,
    ).toMatch(/mudah ditebak/);
    expect(
      fieldErrors(createStudentSchema.safeParse({ ...valid, pinConfirm: "482914" }).error!)
        .pinConfirm,
    ).toBe("PIN tidak sama.");
    expect(
      fieldErrors(createStudentSchema.safeParse({ ...valid, dailyTarget: "0" }).error!).dailyTarget,
    ).toMatch(/minimal 1/);
    expect(
      fieldErrors(createStudentSchema.safeParse({ ...valid, dailyTarget: "21" }).error!)
        .dailyTarget,
    ).toMatch(/maksimal 20/);
    expect(fieldErrors(createStudentSchema.safeParse({ ...valid, grade: "9" }).error!).grade).toBe(
      "Pilih kelas.",
    );
  });

  it("aturan PIN lemah di peramban sama dengan @coreta/db", () => {
    for (const pin of ["000000", "123456", "987654", "482913", "121212", "135790", "456789"]) {
      const accepted = createStudentSchema.safeParse({ ...valid, pin, pinConfirm: pin }).success;
      expect(accepted).toBe(!isWeakPin(pin));
    }
  });
});

describe("skema lain", () => {
  it("NEGATIF: id anak harus uuid", () => {
    expect(
      updateTargetsSchema.safeParse({ studentId: "1", goal: "tka", dailyTarget: 5 }).success,
    ).toBe(false);
    expect(
      resetPinSchema.safeParse({ studentId: "x", pin: "482913", pinConfirm: "482913" }).success,
    ).toBe(false);
  });

  it("masuk siswa butuh kode dan PIN 6 angka", () => {
    expect(studentSignInSchema.safeParse({ code: "RAKA-4826", pin: "482913" }).success).toBe(true);
    expect(fieldErrors(studentSignInSchema.safeParse({ code: "", pin: "12" }).error!)).toEqual({
      code: "Kode masuk wajib diisi.",
      pin: "PIN harus 6 angka.",
    });
  });
});
