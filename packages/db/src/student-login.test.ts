import { describe, expect, it } from "vitest";

import {
  derivePinPassword,
  formatLoginCode,
  generateLoginCode,
  isValidPin,
  isWeakPin,
  LOGIN_CODE_ALPHABET,
  normalizeLoginCode,
  studentAuthEmail,
} from "./student-login";

const pepper = "pepper-uji-minimal-16";
const userId = "5eed0000-0000-4000-8000-000000000021";

describe("kode masuk", () => {
  it("dibuat dari 8 karakter tanpa huruf/angka yang mirip", () => {
    for (let index = 0; index < 200; index += 1) {
      const code = generateLoginCode();
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
      expect(code).not.toMatch(/[IL O01]/);
    }
    expect(LOGIN_CODE_ALPHABET).toHaveLength(31);
  });

  it("memakai sumber acak yang diberikan", () => {
    expect(generateLoginCode(() => 0)).toBe("AAAAAAAA");
    expect(generateLoginCode((max) => max - 1)).toBe("99999999");
  });

  it("menerima ketikan anak: huruf kecil, tanda hubung, spasi", () => {
    expect(normalizeLoginCode(" k7qm-3xpa ")).toBe("K7QM3XPA");
    expect(normalizeLoginCode("K7QM 3XPA")).toBe("K7QM3XPA");
    expect(formatLoginCode("K7QM3XPA")).toBe("K7QM-3XPA");
  });

  it("NEGATIF: bentuk yang salah ditolak", () => {
    for (const input of ["", "K7QM3XP", "K7QM3XPAB", "K7QM3XP0", "K7QM3XPI", "K7QM-3XP!"]) {
      expect(normalizeLoginCode(input)).toBeNull();
    }
  });
});

describe("PIN", () => {
  it("harus 6 angka", () => {
    expect(isValidPin("482913")).toBe(true);
    expect(isValidPin("48291")).toBe(false);
    expect(isValidPin("48291a")).toBe(false);
  });

  it("NEGATIF: PIN yang mudah ditebak ditolak", () => {
    for (const pin of ["000000", "111111", "123456", "234567", "987654", "654321", "12345"]) {
      expect(isWeakPin(pin)).toBe(true);
    }
    for (const pin of ["482913", "121212", "135790"]) {
      expect(isWeakPin(pin)).toBe(false);
    }
  });
});

describe("kata sandi turunan", () => {
  it("tetap untuk pepper, pengguna, dan PIN yang sama; muat di batas bcrypt", () => {
    const password = derivePinPassword(pepper, userId, "482913");
    expect(password).toBe(derivePinPassword(pepper, userId, "482913"));
    expect(password).toMatch(/^pin1\.[\w-]{43}$/);
    expect(password.length).toBeLessThanOrEqual(72);
  });

  it("berbeda bila PIN, pengguna, atau pepper berbeda", () => {
    const base = derivePinPassword(pepper, userId, "482913");
    expect(derivePinPassword(pepper, userId, "482914")).not.toBe(base);
    expect(derivePinPassword(pepper, "5eed0000-0000-4000-8000-000000000022", "482913")).not.toBe(
      base,
    );
    expect(derivePinPassword("pepper-lain-minimal-16", userId, "482913")).not.toBe(base);
    expect(base).not.toContain("482913");
  });

  it("NEGATIF: pepper pendek atau PIN tidak sah ditolak", () => {
    expect(() => derivePinPassword("pendek", userId, "482913")).toThrow();
    expect(() => derivePinPassword(pepper, userId, "12")).toThrow();
  });

  it("email Auth siswa memakai domain .invalid yang tidak bisa menerima email", () => {
    expect(studentAuthEmail(userId)).toBe(`siswa.${userId}@siswa.coreta.invalid`);
  });
});
