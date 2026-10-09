import type {
  AdminItem,
  AdminUser,
  AdminWorksheet,
  ItemOption,
  ItemStats,
  ItemStatus,
  WorkspaceQuestion,
} from "@/lib/domain";

import { mockOverflowQuestions, mockWorkspaceQuestions } from "./workspace";

interface AdminFields {
  competencyCode: string;
  status: ItemStatus;
  version: number;
  difficulty: number;
  answerKey: string[];
  /** Hint per distractor option id; options without an entry get no hint. */
  hints: Record<string, string>;
  explanation: string;
  stats: ItemStats;
}

function fromQuestion(question: WorkspaceQuestion, fields: AdminFields): AdminItem {
  const { hints, ...rest } = fields;
  const options: ItemOption[] = (question.options ?? []).map((option) => ({
    ...option,
    hint: hints[option.id],
  }));
  return {
    id: question.id,
    code: question.code,
    competencyName: question.competencyName,
    tier: question.tier,
    answerType: question.answerType,
    layoutMode: question.layoutMode,
    stem: question.prompt,
    formula: question.formula,
    options,
    equivalents: [],
    stimulusId: question.stimulus?.id,
    media: question.media,
    stimulus: question.stimulus,
    ...rest,
  };
}

const [standard, withMedia, reading] = mockWorkspaceQuestions;
const [longReading, readingWithMedia] = mockOverflowQuestions;

export const adminItems: AdminItem[] = [
  fromQuestion(standard, {
    competencyCode: "M3.2",
    status: "published",
    version: 3,
    difficulty: 0.55,
    answerKey: ["opt-1-a"],
    hints: {
      "opt-1-b": "Perhatikan arah pertidaksamaan setelah menyelesaikan D > 0.",
      "opt-1-c": "Periksa lagi tanda saat memindahkan suku ke ruas kanan.",
      "opt-1-d": "Dua titik berlainan berarti D > 0, bukan D ≥ 0.",
      "opt-1-e": "Dua titik berlainan berarti D > 0, bukan D ≥ 0.",
    },
    explanation:
      "Dua titik potong berlainan berarti D > 0: (−4)² − 4·2·(k − 1) > 0, sehingga 24 − 8k > 0 dan k < 3.",
    stats: { attempts: 212, correctRate: 0.48, reportCount: 4 },
  }),
  fromQuestion(withMedia, {
    competencyCode: "M3.1",
    status: "published",
    version: 2,
    difficulty: 0.4,
    answerKey: ["opt-2-a"],
    hints: {
      "opt-2-b": "Substitusikan x = 1; apakah f(1) bernilai 0?",
      "opt-2-c": "Koefisien x² harus 1 agar puncaknya di (2, −1).",
      "opt-2-d": "Sumbu simetri di x = 2, jadi tanda suku x harus negatif.",
      "opt-2-e": "Bentuk ini bernilai 1 di x = 2, bukan −1.",
    },
    explanation: "Akar 1 dan 3 memberi f(x) = (x − 1)(x − 3) = x² − 4x + 3.",
    stats: { attempts: 188, correctRate: 0.71, reportCount: 1 },
  }),
  fromQuestion(reading, {
    competencyCode: "M4.1",
    status: "review",
    version: 1,
    difficulty: 0.7,
    answerKey: ["opt-3-a"],
    hints: {
      "opt-3-b": "Cocokkan koefisien x dengan produk A, bukan produk B.",
      "opt-3-c": "Bahan dan waktu dibatasi paling banyak, bukan paling sedikit.",
      "opt-3-d": "Periksa kembali liter dan jam per helai untuk tiap produk.",
      "opt-3-e": "Kuota 150 liter dan 100 jam tertukar.",
    },
    explanation:
      "Bahan: 3x + 5y ≤ 150. Waktu mesin: 2x + 4y ≤ 100. Jumlah produksi tidak negatif: x ≥ 0, y ≥ 0.",
    stats: { attempts: 0, correctRate: 0, reportCount: 0 },
  }),
  // Two distractors have no hint, so this draft cannot be published yet.
  fromQuestion(longReading, {
    competencyCode: "M3.5",
    status: "draft",
    version: 1,
    difficulty: 0.75,
    answerKey: ["opt-l-a"],
    hints: {
      "opt-l-b": "Lebar petak adalah x, bukan panjang sisi yang sejajar tebing.",
      "opt-l-c": "Panjang sisi sejajar tebing adalah 80 − 2x.",
    },
    explanation: "Luas = lebar × panjang = x(80 − 2x) = 80x − 2x².",
    stats: { attempts: 0, correctRate: 0, reportCount: 0 },
  }),
  fromQuestion(readingWithMedia, {
    competencyCode: "M3.5",
    status: "draft",
    version: 1,
    difficulty: 0.65,
    answerKey: ["opt-l2-b"],
    hints: {
      "opt-l2-a": "Titik puncak parabola ada di tengah antara dua titik potong sumbu-x.",
      "opt-l2-c": "Pada x = 30, luas sudah menurun.",
      "opt-l2-d": "Pada x = 40, panjang sisi sejajar tebing menjadi 0.",
      "opt-l2-e": "Pada x = 80, panjang sisi sejajar tebing negatif.",
    },
    explanation: "Luas terbesar di titik puncak, yaitu x = −b / 2a = 80 / 4 = 20 meter.",
    stats: { attempts: 0, correctRate: 0, reportCount: 0 },
  }),
  {
    id: "item-isian-01",
    code: "MAT-SMA-ALJ-07",
    competencyCode: "M1.2",
    competencyName: "Persamaan Linear Satu Variabel",
    tier: "dasar",
    answerType: "isian",
    layoutMode: "standar",
    status: "published",
    version: 2,
    difficulty: 0.15,
    stem: "Tentukan nilai x yang memenuhi 3x − 7 = 11.",
    options: [],
    answerKey: ["6"],
    equivalents: ["x = 6", "x=6", "6,0"],
    tolerance: 0,
    explanation: "3x = 18, sehingga x = 6.",
    stats: { attempts: 340, correctRate: 0.95, reportCount: 0 },
  },
  {
    id: "item-pgk-01",
    code: "MAT-SMA-FUN-12",
    competencyCode: "M2.3",
    competencyName: "Fungsi Invers",
    tier: "ujian",
    answerType: "pgk",
    layoutMode: "standar",
    status: "review",
    version: 1,
    difficulty: 0.9,
    stem: "Pilih semua pernyataan yang benar tentang f(x) = (2x + 1) / (x − 3).",
    options: [
      { id: "pgk-a", label: "A", text: "Domain f adalah semua x ≠ 3", hint: undefined },
      { id: "pgk-b", label: "B", text: "f⁻¹ ada karena f satu-satu", hint: undefined },
      {
        id: "pgk-c",
        label: "C",
        text: "f⁻¹(x) = (3x + 1) / (x − 2)",
        hint: "Tukar x dan y, lalu selesaikan untuk y.",
      },
      { id: "pgk-d", label: "D", text: "f(0) = 1/3", hint: "Hitung f(0) = (0 + 1) / (0 − 3)." },
    ],
    answerKey: ["pgk-a", "pgk-b", "pgk-c"],
    equivalents: [],
    explanation: "Penyebut tidak boleh nol; f satu-satu; invers diperoleh dengan menukar x dan y.",
    stats: { attempts: 54, correctRate: 0.2, reportCount: 1 },
  },
  {
    id: "item-bs-01",
    code: "MAT-SMA-STA-03",
    competencyCode: "M6.1",
    competencyName: "Ukuran Pemusatan Data",
    tier: "mahir",
    answerType: "bs",
    layoutMode: "standar",
    status: "retired",
    version: 4,
    difficulty: 0.5,
    stem: "Tentukan benar atau salah untuk tiap pernyataan tentang data 3, 5, 5, 7, 10.",
    options: [
      { id: "bs-1", label: "1", text: "Rata-rata data adalah 6" },
      { id: "bs-2", label: "2", text: "Modus data adalah 5" },
      { id: "bs-3", label: "3", text: "Median data adalah 7" },
    ],
    answerKey: ["bs-1", "bs-2"],
    equivalents: [],
    explanation: "Rata-rata = 30/5 = 6, modus = 5, median = 5 (bukan 7).",
    stats: { attempts: 96, correctRate: 0.62, reportCount: 5 },
  },
];

export function getAdminItem(id: string): AdminItem | undefined {
  return adminItems.find((item) => item.id === id);
}

export const adminWorksheets: AdminWorksheet[] = [
  {
    id: "rel-w41",
    title: "Worksheet Minggu 41 · Akar & Diskriminan",
    stageName: "Tahap 3 · Persamaan Kuadrat",
    releaseLabel: "Senin 12 Okt 2026",
    status: "draft",
    slots: { new: 4, adaptive: 2, review: 2 },
    unpublishedItems: 2,
  },
  {
    id: "rel-w42",
    title: "Worksheet Minggu 42 · Jumlah & Hasil Kali Akar",
    stageName: "Tahap 3 · Persamaan Kuadrat",
    releaseLabel: "Senin 19 Okt 2026",
    status: "draft",
    slots: { new: 4, adaptive: 2, review: 1 },
    unpublishedItems: 0,
  },
  {
    id: "rel-w40",
    title: "Worksheet Minggu 40 · Menentukan Akar",
    stageName: "Tahap 3 · Persamaan Kuadrat",
    releaseLabel: "Senin 5 Okt 2026",
    status: "published",
    slots: { new: 4, adaptive: 2, review: 2 },
    unpublishedItems: 0,
  },
  {
    id: "rel-w39",
    title: "Worksheet Minggu 39 · Fungsi Invers",
    stageName: "Tahap 2 · Fungsi",
    releaseLabel: "Senin 28 Sep 2026",
    status: "published",
    slots: { new: 4, adaptive: 2, review: 2 },
    unpublishedItems: 0,
  },
];

export const adminUsers: AdminUser[] = [
  {
    id: "usr-101",
    name: "Dewi Lestari",
    email: "dewi.lestari@example.com",
    role: "parent",
    subscription: "active",
    lastActiveLabel: "Hari ini",
    active: true,
  },
  {
    id: "usr-102",
    name: "Raka Pratama",
    email: "raka-4821@siswa.coreta.id",
    role: "student",
    lastActiveLabel: "Hari ini",
    active: true,
  },
  {
    id: "usr-103",
    name: "Budi Santoso",
    email: "budi.santoso@example.com",
    role: "parent",
    subscription: "past_due",
    lastActiveLabel: "2 hari lalu",
    active: true,
  },
  {
    id: "usr-104",
    name: "Sari Wulandari",
    email: "sari.w@example.com",
    role: "parent",
    subscription: "trialing",
    lastActiveLabel: "Kemarin",
    active: true,
  },
  {
    id: "usr-105",
    name: "Agus Wijaya",
    email: "agus.wijaya@example.com",
    role: "parent",
    subscription: "expired",
    lastActiveLabel: "3 minggu lalu",
    active: true,
  },
  {
    id: "usr-106",
    name: "Nina Kartika",
    email: "nina.kartika@example.com",
    role: "parent",
    subscription: "canceled",
    lastActiveLabel: "5 hari lalu",
    active: false,
  },
];
