import type { ChatMessage } from "@/lib/domain";

export type HelpAudience = "siswa" | "ortu";

export const assistantName = "Asisten Coreta";

export const initialMessages: Record<HelpAudience, ChatMessage[]> = {
  siswa: [
    {
      id: "siswa-1",
      role: "assistant",
      text: "Halo! Aku asisten Coreta. Tanyakan soal cara memakai worksheet, petunjuk, atau jalur belajarmu.",
      timeLabel: "09.00",
    },
  ],
  ortu: [
    {
      id: "ortu-1",
      role: "assistant",
      text: "Selamat datang. Saya asisten Coreta. Saya bisa membantu soal laporan mingguan, langganan, dan akun anak Anda.",
      timeLabel: "09.00",
    },
  ],
};

const rules: Record<HelpAudience, { keywords: string[]; reply: string }[]> = {
  siswa: [
    {
      keywords: ["petunjuk", "hint"],
      reply:
        "Petunjuk muncul bertahap setelah kamu mencoba menjawab. Kalau petunjuknya membingungkan, tekan 'Laporkan petunjuk' di ruang kerja.",
    },
    {
      keywords: ["worksheet", "soal", "kerjakan"],
      reply:
        "Buka menu Worksheet, pilih worksheet minggu ini, lalu tekan 'Mulai' atau 'Lanjutkan'. Jawabanmu tersimpan otomatis di perangkat.",
    },
    {
      keywords: ["tahap", "jalur", "terkunci"],
      reply:
        "Tahap berikutnya terbuka setelah kamu menguasai kompetensi di tahap sekarang, yaitu skor minimal 80%.",
    },
  ],
  ortu: [
    {
      keywords: ["laporan", "progres", "nilai"],
      reply:
        "Laporan mingguan terbit tiap Senin di menu Laporan. Isinya skor, kemajuan, hal yang perlu perhatian, dan rencana dua minggu ke depan.",
    },
    {
      keywords: ["langganan", "bayar", "harga", "faktur"],
      reply:
        "Anda bisa melihat paket, status, dan faktur di menu Langganan. Perubahan paket berlaku di periode tagihan berikutnya.",
    },
    {
      keywords: ["anak", "akun", "hapus", "data"],
      reply:
        "Akun siswa dibuat dan dikelola dari menu Anak. Di sana Anda juga bisa mengunduh atau meminta penghapusan data anak.",
    },
  ],
};

const fallbackReply: Record<HelpAudience, string> = {
  siswa:
    "Terima kasih sudah bertanya. Ini balasan contoh; nanti asisten sungguhan akan menjawab pertanyaanmu.",
  ortu: "Terima kasih atas pertanyaan Anda. Ini balasan contoh; nanti asisten sungguhan akan menjawab pertanyaan Anda.",
};

/** Canned reply picked by keyword; stands in for the real assistant until it is built. */
export function getMockReply(audience: HelpAudience, text: string): string {
  const lower = text.toLowerCase();
  const rule = rules[audience].find(({ keywords }) =>
    keywords.some((keyword) => lower.includes(keyword)),
  );
  return rule?.reply ?? fallbackReply[audience];
}
