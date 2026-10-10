import type { ChildProfile, WeeklyReport, WeeklyTrendPoint } from "@/lib/domain";

export const childName = "Raka";

export const children: ChildProfile[] = [
  {
    id: "child-raka",
    name: childName,
    grade: "Kelas 11",
    currentStage: "Tahap 3 · Persamaan Kuadrat",
    dailyGoal: 6,
    loginMethod: "code",
    loginLabel: "RAKA-4821",
  },
];

// Newest last. The first two weeks have no full report in the mock data.
export const weeklyTrend: WeeklyTrendPoint[] = [
  { weekId: "2026-W35", label: "24–30 Agu", itemsDone: 28, accuracy: 0.64 },
  { weekId: "2026-W36", label: "31 Agu–6 Sep", itemsDone: 31, accuracy: 0.68 },
  { weekId: "2026-W37", label: "7–13 Sep", itemsDone: 35, accuracy: 0.7 },
  { weekId: "2026-W38", label: "14–20 Sep", itemsDone: 33, accuracy: 0.74 },
  { weekId: "2026-W39", label: "21–27 Sep", itemsDone: 36, accuracy: 0.82 },
  { weekId: "2026-W40", label: "28 Sep–4 Okt", itemsDone: 42, accuracy: 0.78 },
];

export const weeklyReports: WeeklyReport[] = [
  {
    weekId: "2026-W40",
    weekLabel: "28 September–4 Oktober 2026",
    studentName: childName,
    headline: "Raka berlatih lebih banyak, tetapi diskriminan masih perlu diperkuat.",
    narrative:
      "Minggu ini Raka mengerjakan 42 soal, naik 17% dari minggu lalu, dan mencapai target harian di 5 dari 7 hari. Akurasi turun sedikit menjadi 78% karena soal-soal baru tentang diskriminan lebih sulit. Raka mulai menguasai cara menentukan akar persamaan kuadrat dan kini tinggal selangkah lagi dari ambang tuntas.",
    stats: [
      { label: "Hari belajar", value: "5/7", change: 0.25, changeLabel: "dari minggu lalu" },
      { label: "Soal dikerjakan", value: "42", change: 0.17, changeLabel: "dari minggu lalu" },
      {
        label: "Waktu belajar",
        value: "1 j 49 mnt",
        change: 0.08,
        changeLabel: "dari minggu lalu",
      },
      { label: "Akurasi", value: "78%", change: -0.04, changeLabel: "dari minggu lalu" },
    ],
    competencies: [
      { code: "M3.1", name: "Menentukan akar persamaan kuadrat", score: 0.86 },
      { code: "M3.2", name: "Diskriminan & jenis akar", score: 0.62 },
      { code: "M3.3", name: "Jumlah & hasil kali akar", score: 0.35 },
      { code: "M3.4", name: "Menyusun persamaan kuadrat baru", score: 0 },
    ],
    attention: [
      {
        title: "Tanda diskriminan sering terbalik",
        detail:
          "Pada 4 dari 6 soal diskriminan, Raka menulis D = b² + 4ac. Mengulang rumus dengan tanda yang benar akan membantu.",
      },
      {
        title: "Waktu per soal masih panjang untuk soal bacaan",
        detail:
          "Soal bacaan memakan rata-rata 5 menit. Latihan membaca soal cerita bisa mempercepatnya.",
      },
    ],
    sampleInk: {
      prompt: "Tentukan akar dari x² − 5x + 6 = 0.",
      lines: ["x² − 5x + 6 = 0", "(x − 2)(x − 3) = 0", "x = 2 atau x = 3"],
      altText:
        "Coretan tangan Raka: memfaktorkan x kuadrat dikurangi 5x ditambah 6 menjadi (x − 2)(x − 3) sama dengan nol, sehingga x sama dengan 2 atau 3.",
      caption: "Raka memfaktorkan dengan rapi dan memeriksa kedua akarnya.",
    },
    plan: [
      {
        title: "Minggu depan",
        goals: [
          "Ulangi rumus diskriminan lewat 6 soal bertahap",
          "Selesaikan worksheet Akar & Diskriminan",
          "Berlatih 6 soal per hari, minimal 5 hari",
        ],
      },
      {
        title: "Dua minggu lagi",
        goals: [
          "Mulai jumlah & hasil kali akar",
          "Ulang berjarak untuk komposisi fungsi",
          "Capai skor 80% di M3.2",
        ],
      },
    ],
  },
  {
    weekId: "2026-W39",
    weekLabel: "21–27 September 2026",
    studentName: childName,
    headline: "Akurasi Raka naik ke 82% setelah mengulang materi fungsi.",
    narrative:
      "Raka mengerjakan 36 soal dengan akurasi 82%, tertinggi sejauh ini. Pengulangan materi fungsi membuat Raka lebih percaya diri, dan ia menuntaskan Tahap 2 minggu ini.",
    stats: [
      { label: "Hari belajar", value: "4/7", change: 0, changeLabel: "dari minggu lalu" },
      { label: "Soal dikerjakan", value: "36", change: 0.09, changeLabel: "dari minggu lalu" },
      {
        label: "Waktu belajar",
        value: "1 j 32 mnt",
        change: 0.05,
        changeLabel: "dari minggu lalu",
      },
      { label: "Akurasi", value: "82%", change: 0.08, changeLabel: "dari minggu lalu" },
    ],
    competencies: [
      { code: "M2.1", name: "Fungsi linear & grafik", score: 0.88 },
      { code: "M2.2", name: "Komposisi fungsi", score: 0.81 },
      { code: "M2.3", name: "Fungsi invers", score: 0.8 },
    ],
    attention: [
      {
        title: "Fungsi invers masih tipis di atas ambang",
        detail: "Skor 80% pas di ambang tuntas. Satu kali ulang berjarak akan menjaganya.",
      },
    ],
    sampleInk: {
      prompt: "Jika f(x) = 2x − 5, berapakah f(4)?",
      lines: ["f(4) = 2(4) − 5", "= 8 − 5", "= 3"],
      altText:
        "Coretan tangan Raka: f(4) sama dengan 2 kali 4 dikurangi 5, yaitu 8 dikurangi 5, hasilnya 3.",
      caption: "Langkah substitusi ditulis berurutan.",
    },
    plan: [
      {
        title: "Minggu depan",
        goals: ["Mulai Tahap 3: persamaan kuadrat", "Ulang fungsi invers 3 soal"],
      },
      {
        title: "Dua minggu lagi",
        goals: ["Selesaikan menentukan akar", "Mulai diskriminan"],
      },
    ],
  },
];

export const latestReportWeekId = weeklyReports[0]?.weekId ?? "";

export function getWeeklyReport(weekId: string): WeeklyReport | undefined {
  return weeklyReports.find((report) => report.weekId === weekId);
}
