/**
 * Teks persetujuan orang tua (UU PDP) dan versinya. Versi disimpan bersama setiap persetujuan
 * (consents.version, migrasi 0006), jadi MENGUBAH TEKS INI WAJIB MENAIKKAN VERSINYA. Orang tua
 * yang menyetujui versi lama akan diminta menyetujui ulang (lihat hasCurrentConsent).
 */
export const CONSENT_VERSION = "persetujuan-v1-2026-10";

export const consentTypes = ["data_anak", "riset"] as const;
export type ConsentType = (typeof consentTypes)[number];

export interface ConsentPoint {
  title: string;
  body: string;
}

export const consentText = {
  title: "Persetujuan Wali: Pemrosesan Data Siswa",
  intro:
    "Sesuai UU Pelindungan Data Pribadi (UU PDP), Coreta mewajibkan persetujuan orang tua atau wali sebelum akun siswa di bawah umur diaktifkan.",
  points: [
    {
      title: "Penyimpanan Coretan Digital",
      body: "Koordinat goresan stylus disimpan dalam format terkompresi untuk keperluan inferensi petunjuk penalaran matematika oleh AI.",
    },
    {
      title: "Penyusunan Laporan Belajar",
      body: "Sistem menyusun rekap mingguan persentase penguasaan kompetensi dan dikirimkan secara berkala ke email orang tua.",
    },
    {
      title: "Jaminan Perlindungan Privasi",
      body: "Data anak dienkripsi, tidak dipakai untuk pelatihan model pihak ketiga yang tidak berizin, dan tidak pernah diperjualbelikan.",
    },
  ] satisfies ConsentPoint[],
} as const;

/** Apakah keputusan tersimpan adalah persetujuan untuk teks versi yang berlaku sekarang? */
export function isCurrentConsent(row: { granted: boolean; version: string } | null | undefined) {
  return row?.granted === true && row.version === CONSENT_VERSION;
}
