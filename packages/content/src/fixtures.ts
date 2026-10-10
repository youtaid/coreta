// Valid items for the tests. Not exported from the package.

import type { ItemInput } from "./schema";

const choice = (id: string, text: string) => ({ id, label: id.toUpperCase(), text });

export const validPg: ItemInput = {
  code: "MAT-SMA-ALJ-01",
  competency_code: "M3.2",
  tier: "mahir",
  answer_type: "pg",
  stem: { text: "Jika 2x + 3 = 11, nilai x adalah …", formula: "2x + 3 = 11" },
  options: [choice("a", "3"), choice("b", "4"), choice("c", "5"), choice("d", "7")],
  answer_key: ["b"],
  distractor_hints: {
    a: "Periksa kembali: 2 × 3 + 3 = 9, bukan 11.",
    c: "Kurangi 3 dari kedua ruas sebelum membagi.",
    d: "Bagi kedua ruas dengan 2, bukan dengan 1.",
  },
  explanation: { text: "2x = 11 − 3 = 8, sehingga x = 4." },
  layout_mode: "standar",
  difficulty: 0.3,
};

export const validPgk: ItemInput = {
  code: "MAT-SMA-FUN-12",
  competency_code: "M2.3",
  tier: "ujian",
  answer_type: "pgk",
  stem: { text: "Pilih semua pernyataan yang benar tentang f(x) = 2x − 4." },
  options: [
    choice("a", "Gradiennya 2"),
    choice("b", "Memotong sumbu-y di (0, −4)"),
    choice("c", "Grafiknya turun"),
    choice("d", "f(2) = 0"),
  ],
  answer_key: ["a", "b", "d"],
  distractor_hints: { c: "Gradien positif berarti grafik naik." },
  explanation: { text: "Gradien 2 (naik), f(0) = −4, dan f(2) = 0." },
  layout_mode: "standar",
  difficulty: 0.6,
};

export const validBs: ItemInput = {
  code: "MAT-SMA-STA-03",
  competency_code: "M6.1",
  tier: "dasar",
  answer_type: "bs",
  stem: { text: "Tentukan benar atau salah untuk data 3, 5, 5, 7, 10." },
  options: [
    { id: "r1", text: "Rata-rata data adalah 6" },
    { id: "r2", text: "Modus data adalah 5" },
    { id: "r3", text: "Median data adalah 7" },
  ],
  answer_key: ["r1", "r2"],
  distractor_hints: { r3: "Urutkan data: median adalah nilai tengahnya, yaitu 5." },
  explanation: { text: "Rata-rata 30/5 = 6, modus 5, median 5." },
  layout_mode: "standar",
  difficulty: 0.4,
};

export const validIsian: ItemInput = {
  code: "MAT-SMA-ALJ-07",
  competency_code: "M1.2",
  tier: "dasar",
  answer_type: "isian",
  stem: { text: "Tentukan nilai x yang memenuhi 3x − 7 = 11." },
  answer_key: ["6"],
  equivalents: ["x = 6", "6,0"],
  tolerance: 0,
  explanation: { text: "3x = 18, sehingga x = 6." },
  layout_mode: "standar",
  difficulty: 0.15,
};

/** A choice item with a diagram, so it needs layout "media". */
export const validWithMedia: ItemInput = {
  ...validPg,
  code: "MAT-SMA-GEO-02",
  layout_mode: "media",
  media: [
    {
      id: "media-parabola-01",
      kind: "diagram",
      alt_text: "Parabola membuka ke atas dengan titik puncak di (2, −1).",
      pasteable: true,
    },
  ],
};

export const allValid: ItemInput[] = [validPg, validPgk, validBs, validIsian, validWithMedia];

/** Deep copy so a test can change a fixture without affecting the others. */
export function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
