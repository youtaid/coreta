import { createHmac, randomInt } from "node:crypto";

/**
 * Masuk siswa dengan kode + PIN (TIP Fase 36). Dipakai server web dan generator seed, jadi
 * rumusnya harus sama persis di keduanya.
 */

/** Tanpa I, L, O, 0, dan 1 agar tidak tertukar saat anak mengetik. */
export const LOGIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const LOGIN_CODE_LENGTH = 8;
export const PIN_LENGTH = 6;

/** Domain .invalid (RFC 2606) tidak pernah bisa menerima email, jadi tidak bisa ditautkan Google. */
export const STUDENT_EMAIL_DOMAIN = "siswa.coreta.invalid";

const codePattern = new RegExp(`^[${LOGIN_CODE_ALPHABET}]{${LOGIN_CODE_LENGTH}}$`);

export function generateLoginCode(pick: (max: number) => number = randomInt) {
  let code = "";
  for (let index = 0; index < LOGIN_CODE_LENGTH; index += 1) {
    code += LOGIN_CODE_ALPHABET[pick(LOGIN_CODE_ALPHABET.length)];
  }
  return code;
}

/** "k7qm-3xpa " → "K7QM3XPA"; null bila bentuknya bukan kode masuk. */
export function normalizeLoginCode(input: string) {
  const code = input.toUpperCase().replace(/[\s-]/g, "");
  return codePattern.test(code) ? code : null;
}

/** "K7QM3XPA" → "K7QM-3XPA", lebih mudah dibaca dan diketik. */
export function formatLoginCode(code: string) {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function isValidPin(pin: string) {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

/** PIN yang mudah ditebak: semua angka sama, atau berurutan naik/turun (123456, 987654). */
export function isWeakPin(pin: string) {
  if (!isValidPin(pin)) return true;
  const digits = [...pin].map(Number);
  const steps = new Set(digits.slice(1).map((digit, index) => digit - digits[index]));
  return steps.size === 1 && [0, 1, -1].includes([...steps][0]);
}

export function studentAuthEmail(userId: string) {
  return `siswa.${userId}@${STUDENT_EMAIL_DOMAIN}`;
}

/**
 * Kata sandi Supabase Auth untuk siswa: HMAC-SHA256 atas id pengguna dan PIN dengan kunci
 * rahasia server (pepper). Tanpa pepper, mencoba satu juta PIN langsung ke Supabase Auth tidak
 * menghasilkan kata sandi yang benar.
 */
export function derivePinPassword(pepper: string, userId: string, pin: string) {
  if (pepper.length < 16) throw new Error("Pepper PIN siswa minimal 16 karakter.");
  if (!isValidPin(pin)) throw new Error("PIN harus 6 angka.");
  const digest = createHmac("sha256", pepper).update(`${userId}:${pin}`).digest("base64url");
  return `pin1.${digest}`;
}
