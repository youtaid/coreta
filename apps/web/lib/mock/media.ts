import type { WorkspaceMedia } from "@/lib/domain";

/**
 * Mock media assets covering all 4 media types for Fase 12:
 * 1. Gambar & Diagram (Zoomable, Lightbox, Alt Text)
 * 2. Tabel Terstruktur (KaTeX formulas, Responsive horizontal scroll)
 * 3. Audio (HTML5 player, Progress, Transkrip lengkap)
 * 4. Video MP4 (HTML5 player, Takarir/Captions interaktif, Cue navigator)
 */

export const mockDiagramMedia: WorkspaceMedia = {
  id: "media-parabola-01",
  kind: "diagram",
  title: "Grafik Kurva Parabola pada Bidang Kartesius",
  altText:
    "Grafik fungsi kuadrat f(x) = x² - 4x + 3 membuka ke atas pada bidang koordinat kartesius dengan titik minimum P(2, -1), akar-akar di x = 1 dan x = 3, serta titik potong sumbu-Y di (0, 3).",
  caption:
    "Kurva parabola memotong sumbu-X di x = 1 dan x = 3, titik puncak minimum di P(2, -1), serta memotong sumbu-Y di (0, 3).",
};

export const mockImageMedia: WorkspaceMedia = {
  id: "media-irisan-kerucut-02",
  kind: "image",
  title: "Penampang Irisan Kerucut & Titik Fokus Elips",
  altText:
    "Ilustrasi geometri penampang irisan kerucut tegak oleh bidang miring yang membentuk elips sempurna dengan kedua titik fokus F1 dan F2 serta garis direktriks.",
  caption:
    "Penampang irisan kerucut lingkaran tegak dengan bidang miring (kemiringan sudut alpha < beta) menghasilkan bangun elips tertutup.",
  url: "/images/coreta-bertumpuk-warna.png",
};

export const mockTableMedia: WorkspaceMedia = {
  id: "media-tabel-numerasi-03",
  kind: "table",
  title: "Data Kapasitas Produksi & Efisiensi Ekstrak Indigo",
  altText:
    "Tabel data kapasitas harian larutan indigo alami, waktu proses mesin fiksasi warna, serta estimasi margin laba per helai kain untuk Selendang Indigo dan Kain Panjang Klasik.",
  caption:
    "Rekapitulasi parameter alokasi bahan baku pewarna alami dan kuota mesin pada sentra batik tradisional Imogiri.",
  tableData: {
    headers: [
      "Produk Kain",
      "Pewarna ($L$)",
      "Waktu Mesin ($t$)",
      "Target Produksi",
      "Laba Bersih ($P$)",
    ],
    rows: [
      [
        "Selendang Indigo ($x$)",
        "3 liter/helai",
        "2 jam/helai",
        "\\ge 10 \\text{ helai}",
        "Rp45.000",
      ],
      ["Kain Panjang ($y$)", "5 liter/helai", "4 jam/helai", "\\ge 5 \\text{ helai}", "Rp80.000"],
      [
        "Kapasitas Maksimal",
        "150 liter/hari",
        "100 jam/hari",
        "Terserap penuh",
        "\\max Z = 45x + 80y",
      ],
    ],
    footnote:
      "Semua nilai bahan baku dihitung berdasarkan konsentrasi larutan standar 10% pasta daun Indigofera tinctoria.",
  },
};

export const mockAudioMedia: WorkspaceMedia = {
  id: "media-audio-astronomi-04",
  kind: "audio",
  title: "Wawancara: Pengukuran Sudut Paralaks Bintang",
  altText:
    "Rekaman penjelasan narasumber astronom mengenai penerapan fungsi trigonometri tangen dan sinus dalam mengukur jarak benda langit melalui metode paralaks tahunan.",
  caption:
    "Rekaman audio observatorium Bosscha mengenai penentuan jarak bintang dekat menggunakan trigonometri segitiga.",
  audioSpeaker: "Dr. Hendra Gunawan (Observatorium Bosscha)",
  durationLabel: "01:25",
  url: "/sample-audio.mp3",
  transcript: `Narasumber: "Selamat pagi rekan-rekan pembelajar. Dalam astrometri, salah satu metode paling mendasar untuk menentukan jarak bintang yang relatif dekat dengan Tata Surya adalah metode paralaks bintang trigonometrik.

Ketika Bumi mengorbit Matahari sepanjang satu tahun penuh, posisi pengamatan kita terhadap bintang target akan bergeser terhadap latar belakang bintang-bintang yang sangat jauh. Pergeseran sudut semu ini kita sebut sebagai sudut paralaks p.

Perhatikan bahwa jarak rata-rata Bumi ke Matahari, yaitu 1 Satuan Astronomi (atau sekitar 150 juta kilometer), bertindak sebagai alas segitiga siku-siku. Dengan mengukur sudut paralaks p dalam satuan detik busur, kita dapat menghitung jarak d menggunakan perbandingan trigonometri dasar: tangen p sama dengan satu Satuan Astronomi dibagi d.

Karena sudut paralaks selalu sangat kecil—kurang dari 1 detik busur—kita dapat menggunakan pendekatan sudut kecil di mana tangen p mendekati p dalam radian. Inilah dasar definisi jarak 1 parsek, yaitu jarak ketika sudut paralaks bernilai tepat 1 detik busur."`,
};

export const mockVideoMedia: WorkspaceMedia = {
  id: "media-video-parabola-05",
  kind: "video",
  title: "Simulasi Vektor Gerak Parabola di Ruang Hampa",
  altText:
    "Video simulasi visual dekomposisi vektor kecepatan horizontal vx dan vertikal vy pada benda yang ditembakkan dengan sudut elevasi 45 derajat tanpa hambatan udara.",
  caption:
    "Visualisasi animasi dekomposisi vektor kecepatan pada gerak parabola dengan gravitasi konstan g = 9.8 m/s².",
  durationLabel: "00:30",
  url: "/sample-video.mp4",
  posterUrl: "/images/coreta-bertumpuk-gelap-latar-navy.png",
  captions: [
    {
      start: 0,
      end: 6,
      text: "Selamat datang pada simulasi gerak parabola: kita proyeksikan peluru pada sudut elevasi θ = 45°.",
    },
    {
      start: 6,
      end: 14,
      text: "Komponen kecepatan horizontal vx bersifat konstan: vx = v0 · cos(θ) karena tidak ada percepatan pada sumbu-X.",
    },
    {
      start: 14,
      end: 22,
      text: "Pada sumbu-Y, kecepatan vertikal vy berkurang secara linear: vy = v0 · sin(θ) - g · t akibat tarikan gravitasi.",
    },
    {
      start: 22,
      end: 30,
      text: "Di puncak lintasan (h_maks), kecepatan vertikal vy tepat nol sebelum peluru kembali dipercepat ke arah bumi.",
    },
  ],
};

export const mockMediaCollection = [
  mockDiagramMedia,
  mockImageMedia,
  mockTableMedia,
  mockAudioMedia,
  mockVideoMedia,
] as const;
