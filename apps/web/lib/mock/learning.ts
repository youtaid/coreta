import type { CompetencyMastery, Stage, StatSummary, WorksheetSummary } from "@/lib/domain";

export const stages: Stage[] = [
  { number: 0, name: "Bilangan & Aljabar Dasar", status: "mastered", progress: 1 },
  { number: 1, name: "Persamaan & Pertidaksamaan Linear", status: "mastered", progress: 1 },
  { number: 2, name: "Fungsi", status: "mastered", progress: 1 },
  { number: 3, name: "Persamaan Kuadrat", status: "active", progress: 0.4 },
  { number: 4, name: "Barisan & Deret", status: "locked", progress: 0 },
  { number: 5, name: "Geometri & Trigonometri", status: "locked", progress: 0 },
  { number: 6, name: "Statistika", status: "locked", progress: 0 },
  { number: 7, name: "Peluang & Kombinatorika", status: "locked", progress: 0 },
  { number: 8, name: "Penalaran Matematika", status: "locked", progress: 0 },
];

export const worksheets: WorksheetSummary[] = [
  {
    id: "ws-mock-301",
    title: "Worksheet Minggu 3",
    stageName: "Tahap 3 · Persamaan Kuadrat",
    itemCount: 8,
    answeredCount: 0,
    estimatedMinutes: 25,
    status: "new",
    dueLabel: "Minggu ini",
  },
  {
    id: "ws-mock-302",
    title: "Akar & Diskriminan",
    stageName: "Tahap 3 · Persamaan Kuadrat",
    itemCount: 8,
    answeredCount: 5,
    estimatedMinutes: 25,
    status: "in_progress",
    dueLabel: "Minggu ini",
  },
  {
    id: "ws-mock-205",
    title: "Ulang: Komposisi Fungsi",
    stageName: "Tahap 2 · Fungsi",
    itemCount: 6,
    answeredCount: 0,
    estimatedMinutes: 15,
    status: "review",
    dueLabel: "Hari ini",
  },
  {
    id: "ws-mock-201",
    title: "Fungsi Linear & Grafik",
    stageName: "Tahap 2 · Fungsi",
    itemCount: 8,
    answeredCount: 8,
    estimatedMinutes: 25,
    status: "completed",
    score: 0.8125,
  },
];

export const competencies: CompetencyMastery[] = [
  { code: "M3.1", name: "Menentukan akar persamaan kuadrat", score: 0.86 },
  { code: "M3.2", name: "Diskriminan & jenis akar", score: 0.62 },
  { code: "M3.3", name: "Jumlah & hasil kali akar", score: 0.35 },
  { code: "M3.4", name: "Menyusun persamaan kuadrat baru", score: 0 },
];

export const weeklyStats: StatSummary[] = [
  {
    label: "Soal dikerjakan",
    value: "42",
    change: 0.17,
    changeLabel: "dari minggu lalu",
  },
  {
    label: "Akurasi",
    value: "78%",
    change: -0.04,
    changeLabel: "dari minggu lalu",
  },
  {
    label: "Waktu per soal",
    value: "2,6 mnt",
    change: -0.12,
    changeLabel: "dari minggu lalu",
    higherIsBetter: false,
  },
  { label: "Hari mencapai target", value: "5/7" },
];
