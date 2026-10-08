"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

const samples = [
  {
    label: "Sukses",
    type: "success",
    title: "Jawaban terkirim",
    description: "Soal 3 sudah dinilai.",
  },
  {
    label: "Info",
    type: "info",
    title: "Petunjuk baru",
    description: "Coba periksa lagi tanda pada langkah kedua.",
  },
  {
    label: "Perhatian",
    type: "warning",
    title: "Sedang offline",
    description: "Jawaban disimpan di perangkat dan dikirim nanti.",
  },
  {
    label: "Galat",
    type: "error",
    title: "Gagal mengunggah coretan",
    description: "Periksa koneksi lalu coba lagi.",
  },
] as const;

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      {samples.map(({ label, ...options }) => (
        <Button key={options.type} variant="outline" onClick={() => toast.add(options)}>
          {label}
        </Button>
      ))}
    </div>
  );
}
