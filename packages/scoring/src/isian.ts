import type { IsianAnswer, IsianItem, ScoreResult } from "./types";

/**
 * Units a student may type after a number; they are dropped before comparing. Anything else after
 * the number makes the answer non-numeric, so "60 apel" is not read as 60.
 */
export const REGISTERED_UNITS: readonly string[] = [
  "rupiah",
  "idr",
  "mm",
  "cm",
  "dm",
  "m",
  "km",
  "meter",
  "mg",
  "g",
  "gram",
  "kg",
  "kilogram",
  "ton",
  "l",
  "liter",
  "ml",
  "detik",
  "dtk",
  "menit",
  "mnt",
  "jam",
  "hari",
  "minggu",
  "bulan",
  "tahun",
  "cm2",
  "cm²",
  "m2",
  "m²",
  "cm3",
  "cm³",
  "m3",
  "m³",
  "°",
  "derajat",
  "orang",
  "buah",
  "km/jam",
  "m/s",
];

const MAGNITUDES: Readonly<Record<string, number>> = {
  ribu: 1_000,
  rb: 1_000,
  juta: 1_000_000,
  jt: 1_000_000,
};

const MAX_LENGTH = 100;

/** Floating-point noise allowed on top of the item's tolerance (relative to the key). */
const EPSILON = 1e-9;

const THOUSANDS_DOT = /^[1-9]\d{0,2}(\.\d{3})+$/;
const THOUSANDS_COMMA = /^[1-9]\d{0,2}(,\d{3})+$/;

/** Reads a plain number: digits with optional thousand separators and a decimal separator. */
function parseDecimal(raw: string): number | null {
  if (!/^\d[\d.,]*$/.test(raw) && !/^[.,]\d+$/.test(raw)) return null;

  const lastDot = raw.lastIndexOf(".");
  const lastComma = raw.lastIndexOf(",");
  let integerPart = raw;
  let fraction = "";

  if (lastDot >= 0 && lastComma >= 0) {
    // Both present: whichever comes last is the decimal separator, the other groups thousands.
    const decimalAt = Math.max(lastDot, lastComma);
    const thousandsSep = decimalAt === lastDot ? "," : ".";
    integerPart = raw.slice(0, decimalAt);
    fraction = raw.slice(decimalAt + 1);
    const grouped = thousandsSep === "." ? THOUSANDS_DOT : THOUSANDS_COMMA;
    if (!grouped.test(integerPart)) return null;
    integerPart = integerPart.replaceAll(thousandsSep, "");
  } else if (lastComma >= 0) {
    if (raw.indexOf(",") === lastComma) {
      // A single comma is the Indonesian decimal comma.
      integerPart = raw.slice(0, lastComma);
      fraction = raw.slice(lastComma + 1);
    } else if (THOUSANDS_COMMA.test(raw)) {
      integerPart = raw.replaceAll(",", "");
    } else {
      return null;
    }
  } else if (lastDot >= 0) {
    if (THOUSANDS_DOT.test(raw)) {
      // "60.000" is sixty thousand; "0.500" and "1.5" are decimals.
      integerPart = raw.replaceAll(".", "");
    } else if (raw.indexOf(".") === lastDot) {
      integerPart = raw.slice(0, lastDot);
      fraction = raw.slice(lastDot + 1);
    } else {
      return null;
    }
  }

  if (integerPart === "" && fraction === "") return null;
  const value = Number(`${integerPart || "0"}${fraction ? `.${fraction}` : ""}`);
  return Number.isFinite(value) ? value : null;
}

/** Reads the number part: a decimal, a fraction like 3/4, or a mixed number like 1 1/2. */
function parseNumberPart(text: string): number | null {
  const mixed = /^(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(text);
  if (mixed) {
    const [, whole, numerator, denominator] = mixed;
    if (Number(denominator) === 0) return null;
    return Number(whole) + Number(numerator) / Number(denominator);
  }

  const compact = text.replace(/\s+/g, "");
  const slash = compact.split("/");
  if (slash.length === 2) {
    const numerator = parseDecimal(slash[0] ?? "");
    const denominator = parseDecimal(slash[1] ?? "");
    if (numerator === null || denominator === null || denominator === 0) return null;
    return numerator / denominator;
  }
  return slash.length === 1 ? parseDecimal(compact) : null;
}

/**
 * Turns what a student typed into a number, or null when it is not a number.
 *
 * Accepted: spaces anywhere; a leading "Rp", "Rp." or "IDR"; a trailing ",-"; a registered unit
 * after the number; the words "ribu" and "juta" (also "rb" and "jt"); percent ("75%", "75 persen")
 * as a ratio; fractions ("3/4") and mixed numbers ("1 1/2"); a minus sign ("-" or "−").
 *
 * Separators follow Indonesian writing. "60.000" is 60000 (a dot followed by exactly three digits,
 * with no leading zero, groups thousands); "0,75" and "0.75" are both 0.75; a single comma is a
 * decimal comma; with both marks present the last one is the decimal separator ("1.234,5" and
 * "1,234.5" are both 1234.5). Percent becomes a ratio, so "75%" equals 0.75; an item whose key is a
 * percentage number such as 75 should list "75%" among its equivalents or use 0.75 as the key.
 *
 * Never throws: blank input and text that is not a number give null.
 */
export function normalizeAnswer(input: string | null | undefined): number | null {
  if (typeof input !== "string" || input.length > MAX_LENGTH) return null;

  let text = input.toLowerCase().replace(/[   ]/g, " ").replace(/[−–]/g, "-").trim();
  if (text === "") return null;

  let sign = 1;
  if (text.startsWith("-") || text.startsWith("+")) {
    if (text.startsWith("-")) sign = -1;
    text = text.slice(1).trimStart();
  }

  text = text.replace(/^(rp\.?|idr)\s*/, "").replace(/,-$/, "");

  const match = /^([\d.,/\s]+?)\s*([^\d.,/\s].*)?$/.exec(text);
  if (!match) return null;
  const numberPart = match[1] ?? "";
  let rest = (match[2] ?? "").trim();

  let value = parseNumberPart(numberPart.trim());
  if (value === null) return null;

  if (rest === "%" || rest === "persen") {
    value /= 100;
    rest = "";
  } else {
    const magnitude = /^(ribu|rb|juta|jt)\b\s*(.*)$/.exec(rest);
    if (magnitude) {
      value *= MAGNITUDES[magnitude[1] ?? ""] ?? 1;
      rest = (magnitude[2] ?? "").trim();
    }
    if (rest !== "" && !REGISTERED_UNITS.includes(rest)) return null;
  }

  return sign * value;
}

function sameText(a: string, b: string): boolean {
  const clean = (value: string) => value.toLowerCase().replace(/\s+/g, "");
  // A blank answer never matches, even against a blank equivalent.
  return clean(a) !== "" && clean(a) === clean(b);
}

/**
 * Scores a short answer: 1 when it equals the key, or an equivalent, within the item's tolerance
 * (0 when absent); otherwise 0. Numbers are compared as numbers after normalizeAnswer, with only
 * floating-point noise allowed beyond the tolerance. An equivalent that is not a number, such as
 * "x = 6", matches by text with spaces and case ignored. A blank answer or text that is not a
 * number scores 0 without an error. Short answers have no per-option hints.
 *
 * Throws when the item is malformed: its key is not a number, or its tolerance is negative.
 */
export function scoreIsian(item: IsianItem, answer: IsianAnswer): ScoreResult {
  const key = normalizeAnswer(item.key);
  if (key === null) {
    throw new Error(`Butir isian tidak valid: kunci "${item.key}" bukan angka.`);
  }
  const tolerance = item.tolerance ?? 0;
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error("Butir isian tidak valid: toleransi harus 0 atau lebih.");
  }

  const text = answer.text ?? "";
  const value = normalizeAnswer(text);

  const near = (target: number) =>
    Math.abs((value ?? Number.NaN) - target) <= tolerance + EPSILON * Math.max(1, Math.abs(target));

  let correct = value !== null && near(key);
  for (const equivalent of item.equivalents ?? []) {
    if (correct) break;
    const target = normalizeAnswer(equivalent);
    correct = target !== null ? value !== null && near(target) : sameText(text, equivalent);
  }

  return { score: correct ? 1 : 0, correct, hints: [] };
}
