import type { WorkspaceQuestion } from "@/lib/domain";

import { mockTableMedia } from "./media";

export const mockWorkspaceQuestions: readonly WorkspaceQuestion[] = [
  {
    id: "item-math-01",
    number: 1,
    totalQuestions: 8,
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
    totalQuestions: 8,
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
      pasteable: true,
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
    totalQuestions: 8,
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
  {
    id: "item-math-04",
    number: 4,
    totalQuestions: 8,
    code: "MAT-SMA-ALJ-04",
    competencyName: "Analisis Karakteristik Parabola",
    tier: "mahir",
    answerType: "pgk",
    layoutMode: "standar",
    prompt:
      "Diberikan fungsi f(x) = x² - 2x + 5. Pilih semua pernyataan berikut yang benar mengenai karakteristik fungsi tersebut! (Pilihlah semua jawaban yang tepat)",
    formula: "f(x) = (x - 1)^2 + 4",
    options: [
      { id: "opt-4-a", label: "A", text: "Titik balik minimum berada di koordinat (1, 4)" },
      { id: "opt-4-b", label: "B", text: "Grafik memotong sumbu-Y di titik (0, -5)" },
      { id: "opt-4-c", label: "C", text: "Nilai minimum fungsi f(x) adalah 4" },
      { id: "opt-4-d", label: "D", text: "Kurva memotong sumbu-X di dua titik berlainan" },
    ],
  },
  {
    id: "item-math-05",
    number: 5,
    totalQuestions: 8,
    code: "MAT-SMA-MAT-05",
    competencyName: "Operasi & Sifat Matriks",
    tier: "dasar",
    answerType: "bs",
    layoutMode: "standar",
    prompt:
      "Tentukan kebenaran dari masing-masing pernyataan terkait sifat dan operasi matriks persegi berikut ini!",
    statements: [
      {
        id: "row-5-1",
        label: "1",
        text: "Jika matriks A berordo 2×2 memiliki invers, maka determinan A ≠ 0.",
      },
      {
        id: "row-5-2",
        label: "2",
        text: "Untuk setiap dua matriks persegi A dan B, selalu berlaku AB = BA.",
      },
      {
        id: "row-5-3",
        label: "3",
        text: "Determinan matriks transpos det(Aᵀ) sama dengan det(A).",
      },
      {
        id: "row-5-4",
        label: "4",
        text: "Matriks singular adalah matriks yang memiliki nilai determinan bernilai satu.",
      },
    ],
  },
  {
    id: "item-math-06",
    number: 6,
    totalQuestions: 8,
    code: "MAT-SMA-LIT-06",
    competencyName: "Aritmetika Sosial & Keuntungan",
    tier: "mahir",
    answerType: "isian",
    layoutMode: "standar",
    prompt:
      "Seorang pedagang membeli barang seharga Rp50.000 dan menjualnya kembali dengan margin keuntungan 20%. Berapakah harga jual barang tersebut (dalam rupiah)? Ketikkan angka atau nominal rupiah.",
    placeholder: "Contoh: 60.000 atau Rp60.000",
  },
  {
    id: "item-math-07",
    number: 7,
    totalQuestions: 8,
    code: "MAT-SMA-DIM-07",
    competencyName: "Dimensi Tiga & Jarak Titik",
    tier: "ujian",
    answerType: "pg",
    layoutMode: "standar",
    prompt:
      "Diketahui kubus ABCD.EFGH dengan panjang rusuk 6 cm. Jarak dari titik C ke bidang diagonal BDHF adalah...",
    formula: "d = \\frac{1}{2} s \\sqrt{2}",
    options: [
      { id: "opt-7-a", label: "A", text: "3 cm" },
      { id: "opt-7-b", label: "B", text: "3√2 cm" },
      { id: "opt-7-c", label: "C", text: "3√3 cm" },
      { id: "opt-7-d", label: "D", text: "6√2 cm" },
    ],
  },
  {
    id: "item-math-08",
    number: 8,
    totalQuestions: 8,
    code: "MAT-SMA-STA-08",
    competencyName: "Statistika & Transformasi Data",
    tier: "ujian",
    answerType: "pgk",
    layoutMode: "standar",
    prompt:
      "Sekumpulan data memiliki rata-rata 50 dan simpangan baku 10. Jika setiap nilai data dikalikan 2 lalu dikurangi 5, pilih semua pernyataan yang benar!",
    options: [
      { id: "opt-8-a", label: "A", text: "Rata-rata baru menjadi 100" },
      { id: "opt-8-b", label: "B", text: "Rata-rata baru menjadi 95" },
      { id: "opt-8-c", label: "C", text: "Simpangan baku baru menjadi 15" },
      { id: "opt-8-d", label: "D", text: "Simpangan baku baru menjadi 20" },
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

// Content that overflows the three standard layouts, used to exercise the "tidak muat" rule.
const longReadingBody = `Koperasi Tani Makmur di lereng Gunung Merbabu mengelola kebun sayur seluas dua hektare yang dibagi menjadi beberapa petak berbentuk persegi panjang. Setiap musim tanam, pengurus koperasi menyusun rencana penggunaan lahan supaya hasil panen maksimal tanpa membuat tanah kehilangan kesuburannya. Rencana itu dibahas bersama seluruh anggota di balai desa setiap awal bulan.

Tahun ini koperasi menerima bantuan pagar kawat sepanjang 80 meter. Pagar tersebut akan dipakai untuk mengelilingi satu petak percobaan yang ditanami bawang daun. Salah satu sisi petak berbatasan langsung dengan tebing sehingga tidak memerlukan pagar. Dengan demikian, pagar hanya dipasang pada tiga sisi: dua sisi tegak lurus tebing dan satu sisi yang sejajar dengan tebing.

Ketua koperasi, Bu Sari, ingin petak percobaan itu seluas mungkin. Ia meminta Dimas, anak seorang anggota yang sedang belajar di kelas XI, untuk membantu menghitung ukuran petak. Dimas memisalkan lebar petak, yaitu panjang sisi yang tegak lurus tebing, dengan x meter. Karena kawat yang tersedia tepat 80 meter, panjang sisi yang sejajar tebing menjadi 80 dikurangi dua kali x.

Dimas kemudian menyatakan luas petak sebagai hasil kali lebar dan panjangnya. Ia mendapati bahwa luas petak berubah mengikuti nilai x, dan bentuk hubungannya bukan garis lurus melainkan lengkungan yang membuka ke bawah. Artinya, ada satu nilai x yang menghasilkan luas terbesar. Jika x terlalu kecil, petak menjadi sempit memanjang; jika x terlalu besar, petak menjadi pendek dan hampir tidak punya panjang.

Pak Anton, penyuluh pertanian dari kecamatan, menambahkan beberapa syarat. Pertama, lebar petak tidak boleh kurang dari 5 meter agar mesin pembajak kecil dapat masuk. Kedua, panjang sisi yang sejajar tebing minimal 20 meter agar jarak tanam bawang daun tetap teratur. Ketiga, seluruh kawat harus terpakai habis karena sisa kawat yang pendek tidak dapat dipakai di tempat lain.

Selain itu, Pak Anton mengingatkan bahwa hasil panen bergantung pada kepadatan tanam. Dari pengalaman tahun lalu, setiap satu meter persegi petak menghasilkan rata-rata 1,5 kilogram bawang daun segar. Harga jual di pasar kecamatan sekitar Rp12.000 per kilogram, tetapi harga itu bisa turun sampai Rp8.000 ketika panen raya. Karena itu, koperasi ingin tahu luas maksimum yang mungkin supaya dapat memperkirakan pendapatan paling tinggi dan paling rendah.

Anggota koperasi yang lain mengusulkan agar petak dibuat persegi karena bentuk itu terlihat rapi. Dimas menjelaskan bahwa dengan kawat yang hanya dipasang pada tiga sisi, bentuk persegi belum tentu memberikan luas terbesar. Ia mengajak semua orang menghitung dahulu dua kemungkinan, yaitu petak berbentuk persegi dan petak dengan lebar sepuluh meter, lalu membandingkan luas keduanya dengan luas yang diperoleh dari model matematika.

Pak Anton juga menyarankan agar koperasi mencatat biaya yang dikeluarkan untuk petak percobaan ini. Biaya benih bawang daun sekitar Rp3.000 untuk setiap meter persegi, ditambah pupuk kandang dan upah penyiraman yang jika dijumlahkan mencapai Rp2.500 per meter persegi. Dengan catatan itu, koperasi dapat menghitung laba bersih dari petak percobaan dan memutuskan apakah petak serupa layak dibuat di lahan lain yang masih kosong.

Beberapa anggota yang sudah berpengalaman bercerita bahwa pada musim lalu satu petak berukuran 15 meter kali 30 meter pernah gagal panen karena genangan air di sisi yang berbatasan dengan tebing. Mereka berharap rancangan baru memberi ruang untuk saluran air kecil di sepanjang sisi tebing. Saluran itu tidak mengurangi luas tanam karena dibuat di luar batas pagar, sehingga perhitungan Dimas tetap berlaku untuk bagian petak yang dipagari kawat.

Setelah beberapa kali mencoba, Dimas menuliskan semua langkahnya di papan tulis balai desa. Ia memeriksa titik-titik penting pada kurva luas, yaitu titik potong dengan sumbu mendatar dan titik puncaknya. Para anggota koperasi mengikuti penjelasan itu dengan saksama, dan Bu Sari mencatat bahwa model sederhana seperti ini bisa dipakai kembali untuk merencanakan petak-petak lain pada musim berikutnya, termasuk petak sayur lain yang bentuk dan ukurannya berbeda.`;

const longReadingStimulus = {
  id: "stimulus-pagar-01",
  kind: "reading",
  title: "Menentukan Ukuran Petak Bawang Daun Koperasi Tani Makmur",
  subtitle: "Studi Kasus Fungsi Kuadrat dan Luas Maksimum",
  source: "Catatan Rapat Koperasi Tani Makmur (2026)",
  bodyText: longReadingBody,
} as const;

const longReadingOptions = [
  { id: "opt-l-a", label: "A", text: "L(x) = 80x − 2x²" },
  { id: "opt-l-b", label: "B", text: "L(x) = 80x − x²" },
  { id: "opt-l-c", label: "C", text: "L(x) = 40x − 2x²" },
  { id: "opt-l-d", label: "D", text: "L(x) = 80x + 2x²" },
  { id: "opt-l-e", label: "E", text: "L(x) = 2x² − 80x" },
] as const;

export const mockOverflowQuestions: readonly WorkspaceQuestion[] = [
  {
    id: "item-long-01",
    number: 1,
    totalQuestions: 2,
    code: "MAT-SMA-KUA-11",
    competencyName: "Fungsi Kuadrat & Luas Maksimum",
    tier: "ujian",
    answerType: "pg",
    // Declared "standar": the stimulus alone pushes the layout up to bacaan.
    layoutMode: "standar",
    stimulus: longReadingStimulus,
    prompt:
      "Berdasarkan bacaan, jika x menyatakan lebar petak dalam meter, fungsi luas petak L(x) adalah …",
    options: [...longReadingOptions],
  },
  {
    id: "item-long-02",
    number: 2,
    totalQuestions: 2,
    code: "MAT-SMA-KUA-12",
    competencyName: "Fungsi Kuadrat & Luas Maksimum",
    tier: "ujian",
    answerType: "pg",
    layoutMode: "bacaan",
    stimulus: longReadingStimulus,
    // Reading plus media leaves no room for a fourth panel, so the diagram floats.
    media: {
      id: "media-parabola-02",
      kind: "diagram",
      pasteable: true,
      altText:
        "Grafik luas petak terhadap lebar x berbentuk parabola membuka ke bawah dengan titik puncak di x = 20.",
      title: "Grafik Luas Petak L(x)",
      caption: "Luas petak mencapai nilai terbesar pada titik puncak parabola.",
    },
    prompt:
      "Perhatikan grafik luas petak L(x) pada jendela melayang. Lebar petak yang menghasilkan luas terbesar adalah …",
    options: [
      { id: "opt-l2-a", label: "A", text: "10 meter" },
      { id: "opt-l2-b", label: "B", text: "20 meter" },
      { id: "opt-l2-c", label: "C", text: "30 meter" },
      { id: "opt-l2-d", label: "D", text: "40 meter" },
      { id: "opt-l2-e", label: "E", text: "80 meter" },
    ],
  },
];

export const mockOverflowAssignment: MockWorkspaceAssignment = {
  id: "demo-bacaan-panjang",
  title: "Worksheet Bacaan Panjang & Media",
  stageName: "Tahap 3 — Persamaan Kuadrat",
  totalQuestions: mockOverflowQuestions.length,
  estimatedMinutes: 15,
  questions: mockOverflowQuestions,
};

// One question whose table can be pasted onto the scratch area and written on.
export const mockPasteQuestions: readonly WorkspaceQuestion[] = [
  {
    id: "item-tabel-01",
    number: 1,
    totalQuestions: 1,
    code: "MAT-SMA-PRG-01",
    competencyName: "Program Linear",
    tier: "mahir",
    answerType: "pg",
    layoutMode: "media",
    media: { ...mockTableMedia, pasteable: true },
    prompt:
      "Berdasarkan tabel, jika x banyak Selendang Indigo dan y banyak Kain Panjang yang diproduksi, batasan pewarna harian dinyatakan oleh …",
    options: [
      { id: "opt-t-a", label: "A", text: "3x + 5y ≤ 150" },
      { id: "opt-t-b", label: "B", text: "5x + 3y ≤ 150" },
      { id: "opt-t-c", label: "C", text: "2x + 4y ≤ 150" },
      { id: "opt-t-d", label: "D", text: "3x + 5y ≥ 150" },
    ],
  },
];

export const mockPasteAssignment: MockWorkspaceAssignment = {
  id: "demo-tempel",
  title: "Worksheet Lapisan Tempel",
  stageName: "Tahap 3 — Persamaan Kuadrat",
  totalQuestions: mockPasteQuestions.length,
  estimatedMinutes: 10,
  questions: mockPasteQuestions,
};

const mockAssignments: readonly MockWorkspaceAssignment[] = [
  mockWorkspaceAssignment,
  mockOverflowAssignment,
  mockPasteAssignment,
];

/** Falls back to the default demo assignment for any id without its own mock data. */
export function getMockWorkspaceAssignment(assignmentId: string): MockWorkspaceAssignment {
  return mockAssignments.find((a) => a.id === assignmentId) ?? mockWorkspaceAssignment;
}
