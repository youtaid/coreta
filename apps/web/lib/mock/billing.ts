import type { Invoice, Plan, PlanId, SubscriptionStatus, SubscriptionView } from "@/lib/domain";

// Monthly price is from the PRD; semester/annual prices are placeholders until pricing is decided.
// Annual follows the phase 16 scope (Rp249.000); earlier mock data used Rp269.000.
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
    price: 249_000,
    strikePrice: 358_800,
    months: 12,
    description: "Paling hemat sampai hari ujian.",
    features: ["Semua fitur Semester", "Latihan ujian TKA & UTBK", "Prioritas tinjauan petunjuk"],
  },
];

export const TRIAL_DAYS = 7;

export const defaultSubscriptionStatus: SubscriptionStatus = "active";

const paymentMethod = "Virtual account BCA";

/** One mock subscription per status, so every state of the screen can be previewed. */
export const subscriptionViews: Record<SubscriptionStatus, SubscriptionView> = {
  trialing: {
    status: "trialing",
    planId: "monthly",
    summary: `Anda sedang dalam uji coba gratis ${TRIAL_DAYS} hari. Tidak ada data pembayaran yang diminta. Pilih paket sebelum uji coba berakhir agar belajar anak tidak terputus.`,
    facts: [
      { label: "Uji coba berakhir", value: "10 Okt 2026" },
      { label: "Sisa waktu", value: "3 hari" },
    ],
    paymentMethod: null,
  },
  active: {
    status: "active",
    planId: "semester",
    summary:
      "Langganan aktif. Mengganti paket berlaku di periode tagihan berikutnya. Jeda bisa 1–4 minggu, maksimal 2 kali setahun.",
    facts: [
      { label: "Periode berjalan", value: "3 Okt 2026 – 3 Apr 2027" },
      { label: "Tagihan berikutnya", value: "3 Apr 2027" },
    ],
    paymentMethod,
  },
  paused: {
    status: "paused",
    planId: "semester",
    summary:
      "Langganan sedang dijeda dan tidak ada tagihan selama jeda. Belajar dilanjutkan otomatis saat jeda berakhir.",
    facts: [
      { label: "Dijeda sejak", value: "28 Sep 2026" },
      { label: "Lanjut otomatis", value: "19 Okt 2026" },
      { label: "Jeda tahun ini", value: "1 dari 2" },
    ],
    paymentMethod,
  },
  past_due: {
    status: "past_due",
    planId: "monthly",
    summary:
      "Pembayaran terakhir belum berhasil. Akses tetap berjalan selama masa tenggang 3 hari. Setelah itu langganan berakhir.",
    facts: [
      { label: "Tagihan belum dibayar", value: "Rp29.900" },
      { label: "Masa tenggang berakhir", value: "10 Okt 2026" },
    ],
    paymentMethod,
  },
  canceled: {
    status: "canceled",
    planId: "annual",
    summary:
      "Langganan dibatalkan dan tidak diperpanjang. Anak Anda masih bisa belajar sampai periode berjalan habis.",
    facts: [
      { label: "Akses sampai", value: "14 Des 2026" },
      { label: "Dibatalkan pada", value: "1 Okt 2026" },
    ],
    paymentMethod,
  },
  expired: {
    status: "expired",
    planId: "monthly",
    summary:
      "Langganan sudah berakhir. Jawaban dan laporan lama tetap tersimpan. Pilih paket agar anak bisa belajar lagi.",
    facts: [
      { label: "Berakhir pada", value: "30 Sep 2026" },
      { label: "Data belajar", value: "Tetap tersimpan" },
    ],
    paymentMethod: null,
  },
};

export function getPlan(planId: PlanId): Plan {
  const plan = plans.find((item) => item.id === planId);
  if (!plan) throw new Error(`Unknown plan: ${planId}`);
  return plan;
}

export const invoices: Invoice[] = [
  {
    id: "inv-2026-011",
    number: "INV-2026-0011",
    dateLabel: "10 Okt 2026",
    description: "Paket Bulanan · menunggu pembayaran",
    amount: 29_900,
    status: "pending",
  },
  {
    id: "inv-2026-010",
    number: "INV-2026-0010",
    dateLabel: "3 Okt 2026",
    description: "Paket Semester · 3 Okt 2026 – 3 Apr 2027",
    amount: 149_000,
    status: "paid",
  },
  {
    id: "inv-2026-009",
    number: "INV-2026-0009",
    dateLabel: "3 Sep 2026",
    description: "Paket Bulanan · 3 Sep – 3 Okt 2026",
    amount: 29_900,
    status: "paid",
  },
  {
    id: "inv-2026-008",
    number: "INV-2026-0008",
    dateLabel: "3 Agu 2026",
    description: "Paket Bulanan · 3 Agu – 3 Sep 2026",
    amount: 29_900,
    status: "failed",
  },
  {
    id: "inv-2026-007",
    number: "INV-2026-0007",
    dateLabel: "3 Jul 2026",
    description: "Paket Bulanan · 3 Jul – 3 Agu 2026",
    amount: 29_900,
    status: "refunded",
  },
];
