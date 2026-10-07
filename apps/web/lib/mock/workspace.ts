import type { WorkspaceQuestion } from "@/lib/domain";

export const mockWorkspaceQuestions: readonly WorkspaceQuestion[] = [
  {
    id: "item-math-01",
    number: 1,
    totalQuestions: 3,
    code: "MAT-SMA-ALJ-01",
    competencyName: "Fungsi Kuadrat & Determinan",
    tier: "mahir",
    answerType: "pg",
    layoutMode: "standar",
    prompt:
      "Diketahui fungsi kuadrat f(x) = 2x² - 4x + (k - 1). Jika grafik kurva parabola tersebut memotong sumbu-X di dua titik berlainan, tentukan batasan nilai k yang memenuhi persamaan tersebut!",
    formula: "D = b^2 - 4ac > 0 \\implies (-4)^2 - 4(2)(k - 1) > 0",
    options: [
      { id: "opt-1-a", label: "A", text: "k < 3" },
      { id: "opt-1-b", label: "B", text: "k > 3" },
      { id: "opt-1-c", label: "C", text: "k < -3" },
      { id: "opt-1-d", label: "D", text: "k ≤ 3" },
      { id: "opt-1-e", label: "E", text: "k ≥ 3" },
    ],
  },
  {
    id: "item-math-02",
    number: 2,
    totalQuestions: 3,
    code: "MAT-SMA-GEO-02",
    competencyName: "Geometri Analitik & Parabola",
    tier: "mahir",
    answerType: "pg",
    layoutMode: "media",
    prompt:
      "Perhatikan grafik fungsi kuadrat pada diagram kartesius di samping. Parabola tersebut memotong sumbu-X di titik (1, 0) dan (3, 0), serta mencapai titik puncak minimum pada koordinat (2, -1). Persamaan kurva parabola yang tepat adalah...",
    media: {
      id: "media-parabola-01",
      kind: "diagram",
      altText:
        "Grafik fungsi kuadrat membuka ke atas pada bidang kartesius dengan titik puncak di (2, -1) dan memotong sumbu-X di x = 1 dan x = 3.",
      title: "Grafik Kurva Kuadrat pada Bidang Kartesius",
      caption:
        "Kurva parabola memotong sumbu-X di x=1 dan x=3, titik minimum di (2, -1), serta memotong sumbu-Y di (0, 3).",
    },
    options: [
      { id: "opt-2-a", label: "A", text: "f(x) = x² - 4x + 3" },
      { id: "opt-2-b", label: "B", text: "f(x) = x² - 4x - 3" },
      { id: "opt-2-c", label: "C", text: "f(x) = 2x² - 4x + 3" },
      { id: "opt-2-d", label: "D", text: "f(x) = x² + 4x + 3" },
      { id: "opt-2-e", label: "E", text: "f(x) = (x - 2)² + 1" },
    ],
  },
  {
    id: "item-math-03",
    number: 3,
    totalQuestions: 3,
    code: "MAT-SMA-LIT-03",
    competencyName: "Literasi Numerasi & Pemodelan",
    tier: "ujian",
    answerType: "pg",
    layoutMode: "bacaan",
    stimulus: {
      id: "stimulus-batik-01",
      kind: "reading",
      title: "Optimalisasi Efisiensi Pewarna Alami UMKM Batik Yogya",
      subtitle: "Studi Kasus Efisiensi Sumber Daya Produksi dan Kapasitas Harian",
      source: "Kajian Efisiensi Sentra Kerajinan Tradisional DIY (2026)",
      bodyText: `Sentra kerajinan batik cap ramah lingkungan di Imogiri, Yogyakarta, menerapkan sistem pewarnaan berbasis fermentasi daun indigo alami (Indigofera tinctoria). Dalam proses produksinya, pengrajin menghasilkan dua produk unggulan: Selendang Indigo (Produk A) dan Kain Panjang Klasik (Produk B).

Untuk menjaga kestabilan mutu warna biru alami, ekstraksi pasta indigo dilakukan terpusat setiap pagi dengan kuota maksimal 150 liter larutan siap pakai per hari kerja. Di samping keterbatasan bahan pewarna, proses fiksasi warna membutuhkan ruang penganginan dan pencelupan terkontrol dengan total waktu operasional bersama maksimal 100 jam mesin per hari.

Berdasarkan pencatatan siklus kerja bulanan:
• Setiap helai Selendang Indigo (x) membutuhkan 3 liter larutan pewarna alami dan 2 jam proses mesin fiksasi warna.
• Setiap helai Kain Panjang Klasik (y) membutuhkan 5 liter larutan pewarna alami dan 4 jam proses mesin fiksasi warna.

Dari sisi ekonomi, penjualan Selendang Indigo menghasilkan laba bersih Rp45.000 per helai, sedangkan Kain Panjang Klasik memberikan laba bersih Rp80.000 per helai. Mengingat tingginya permintaan menjelang pameran kriya nasional, koperasi pengrajin berencana merumuskan jadwal produksi harian yang memaksimalkan total laba tanpa melanggar batasan ketersediaan bahan larutan maupun kuota waktu mesin fiksasi.

Pengrajin juga menyepakati bahwa jumlah produksi kedua jenis kain tidak mungkin bernilai negatif (x ≥ 0 dan y ≥ 0), serta seluruh kain yang diproduksi terjamin langsung terserap oleh mitra galeri.`,
    },
    prompt:
      "Berdasarkan stimulus bacaan di atas, jika x menyatakan jumlah Selendang Indigo dan y menyatakan jumlah Kain Panjang Klasik yang diproduksi setiap hari, tentukan model sistem pertidaksamaan linear yang membatasi ketersediaan bahan pewarna dan kuota waktu mesin fiksasi!",
    formula: "3x + 5y \\le 150 \\quad \\text{dan} \\quad 2x + 4y \\le 100",
    options: [
      { id: "opt-3-a", label: "A", text: "3x + 5y ≤ 150; 2x + 4y ≤ 100; x ≥ 0; y ≥ 0" },
      { id: "opt-3-b", label: "B", text: "5x + 3y ≤ 150; 4x + 2y ≤ 100; x ≥ 0; y ≥ 0" },
      { id: "opt-3-c", label: "C", text: "3x + 5y ≥ 150; 2x + 4y ≥ 100; x ≥ 0; y ≥ 0" },
      { id: "opt-3-d", label: "D", text: "3x + 2y ≤ 100; 5x + 4y ≤ 150; x ≥ 0; y ≥ 0" },
      { id: "opt-3-e", label: "E", text: "3x + 5y ≤ 100; 2x + 4y ≤ 150; x ≥ 0; y ≥ 0" },
    ],
  },
] as const;

export interface MockWorkspaceAssignment {
  id: string;
  title: string;
  stageName: string;
  totalQuestions: number;
  estimatedMinutes: number;
  questions: readonly WorkspaceQuestion[];
}

export const mockWorkspaceAssignment: MockWorkspaceAssignment = {
  id: "demo-assignment",
  title: "Worksheet Aljabar & Pemodelan Fungsi",
  stageName: "Tahap 2 — Aljabar & Fungsi Kuadrat",
  totalQuestions: mockWorkspaceQuestions.length,
  estimatedMinutes: 25,
  questions: mockWorkspaceQuestions,
};

export function getMockWorkspaceQuestion(
  numberOrId: number | string,
): WorkspaceQuestion | undefined {
  if (typeof numberOrId === "number") {
    return mockWorkspaceQuestions.find((q) => q.number === numberOrId);
  }
  return mockWorkspaceQuestions.find((q) => q.id === numberOrId);
}
