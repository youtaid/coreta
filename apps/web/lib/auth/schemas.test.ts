import { describe, expect, it } from "vitest";

import { fieldErrors, formValues, signInSchema, signUpSchema } from "./schemas";

const validSignUp = {
  fullName: "  Rina Wulandari ",
  email: "Rina@Contoh.com ",
  whatsapp: "0812-3456-7890",
  password: "rahasia-123",
  confirmPassword: "rahasia-123",
  examGoal: "utbk",
  consent: "on",
};

describe("signUpSchema", () => {
  it("merapikan isian yang sah", () => {
    expect(signUpSchema.parse(validSignUp)).toMatchObject({
      fullName: "Rina Wulandari",
      email: "rina@contoh.com",
      whatsapp: "081234567890",
      examGoal: "utbk",
    });
  });

  it("NEGATIF: tanpa centang persetujuan data anak, pendaftaran ditolak", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, consent: undefined });
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!).consent).toMatch(/wajib menyetujui/);
  });

  it("NEGATIF: kata sandi pendek, konfirmasi berbeda, dan nomor WhatsApp salah", () => {
    const result = signUpSchema.safeParse({
      ...validSignUp,
      password: "pendek",
      confirmPassword: "lain",
      whatsapp: "12345",
    });
    expect(result.success).toBe(false);
    const errors = fieldErrors(result.error!);
    expect(errors.password).toBe("Kata sandi minimal 8 karakter.");
    expect(errors.whatsapp).toMatch(/WhatsApp tidak valid/);
  });

  it("NEGATIF: konfirmasi kata sandi harus sama", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, confirmPassword: "rahasia-124" });
    expect(fieldErrors(result.error!).confirmPassword).toBe("Konfirmasi kata sandi tidak cocok.");
  });

  it("NEGATIF: target ujian hanya tka, utbk, atau both", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, examGoal: "sbmptn" });
    expect(fieldErrors(result.error!).examGoal).toBe("Pilih target ujian anak.");
  });

  it("NEGATIF: isian kosong memberi pesan berbahasa Indonesia", () => {
    const result = signUpSchema.safeParse({});
    const errors = fieldErrors(result.error!);
    expect(errors.fullName).toBe("Nama lengkap orang tua wajib diisi.");
    expect(errors.email).toBe("Email wajib diisi.");
  });
});

describe("signInSchema", () => {
  it("menerima email dan kata sandi", () => {
    expect(signInSchema.parse({ email: "A@B.id", password: "x" })).toEqual({
      email: "a@b.id",
      password: "x",
    });
  });

  it("NEGATIF: email salah format", () => {
    const result = signInSchema.safeParse({ email: "bukan-email", password: "x" });
    expect(fieldErrors(result.error!).email).toMatch(/Format email tidak valid/);
  });
});

describe("formValues", () => {
  it("hanya mengambil teks, bukan berkas", () => {
    const data = new FormData();
    data.set("email", "a@b.id");
    data.set("berkas", new Blob(["x"]));
    expect(formValues(data, ["email", "berkas", "hilang"])).toEqual({
      email: "a@b.id",
      berkas: undefined,
      hilang: undefined,
    });
  });
});
