import type { Plan } from "@/lib/domain";

// Monthly price is from the PRD; semester/annual prices are placeholders until pricing is decided.
export const plans: Plan[] = [
  {
    id: "monthly",
    name: "Bulanan",
    price: 29_900,
    months: 1,
    description: "Fleksibel, bisa berhenti kapan saja.",
    features: ["Worksheet mingguan", "Laporan mingguan untuk orang tua", "Petunjuk dari coretan"],
  },
  {
    id: "semester",
    name: "Semester",
    price: 149_000,
    strikePrice: 179_400,
    months: 6,
    description: "Pas untuk satu semester persiapan.",
    features: [
      "Semua fitur Bulanan",
      "Ulang berjarak sebelum ujian",
      "Laporan perkembangan per tahap",
    ],
  },
  {
    id: "annual",
    name: "Tahunan",
    price: 269_000,
    strikePrice: 358_800,
    months: 12,
    description: "Paling hemat sampai hari ujian.",
    features: ["Semua fitur Semester", "Latihan ujian TKA & UTBK", "Prioritas tinjauan petunjuk"],
  },
];
