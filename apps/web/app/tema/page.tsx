import type { Metadata } from "next";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Tema & Token Desain — Coreta",
};

const swatches = [
  { name: "Primer", token: "primary", bg: "bg-primary", fg: "text-primary-foreground" },
  { name: "Latar", token: "background", bg: "bg-background", fg: "text-foreground" },
  { name: "Kartu", token: "card", bg: "bg-card", fg: "text-card-foreground" },
  { name: "Teks", token: "foreground", bg: "bg-foreground", fg: "text-background" },
  { name: "Border", token: "border", bg: "bg-border", fg: "text-foreground" },
  { name: "Sukses", token: "success", bg: "bg-success", fg: "text-success-foreground" },
  { name: "Perhatian", token: "warning", bg: "bg-warning", fg: "text-warning-foreground" },
  { name: "Sekunder", token: "secondary", bg: "bg-secondary", fg: "text-secondary-foreground" },
  { name: "Redup", token: "muted", bg: "bg-muted", fg: "text-muted-foreground" },
] as const;

export default function ThemePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Coreta</p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Tema & Token Desain</h1>
          <p className="max-w-2xl text-muted-foreground">
            Palet, tipografi, dan ukuran sentuh yang dipakai seluruh aplikasi. Tekan tombol di kanan
            untuk berganti tema terang dan gelap.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section aria-labelledby="palet" className="space-y-4">
        <h2 id="palet" className="text-xl font-semibold">
          Palet
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {swatches.map((swatch) => (
            <li
              key={swatch.token}
              className={`${swatch.bg} ${swatch.fg} flex min-h-24 flex-col justify-between rounded-xl border p-4`}
            >
              <span className="font-semibold">{swatch.name}</span>
              <code className="text-sm">--{swatch.token}</code>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="tipografi" className="space-y-4">
        <h2 id="tipografi" className="text-xl font-semibold">
          Tipografi
        </h2>
        <div className="space-y-4 rounded-xl border bg-card p-6 text-card-foreground">
          <p className="text-sm text-muted-foreground">Plus Jakarta Sans — antarmuka</p>
          <p className="text-4xl font-bold tracking-tight">Tahap 3: Persamaan Kuadrat</p>
          <p className="text-2xl font-semibold">Worksheet minggu ini</p>
          <p className="text-lg">Kerjakan 8 soal, coret langsung di layar.</p>
          <p>
            Jawabanmu dinilai otomatis begitu dikumpulkan. Petunjuk muncul kalau kamu memilih
            pengecoh.
          </p>
          <p className="text-sm text-muted-foreground">Teks redup untuk keterangan dan metadata.</p>
          <hr />
          <p className="text-sm text-muted-foreground">Kalam — contoh coretan tangan</p>
          <p className="font-hand text-3xl text-ink">x² + 3x − 4 = 0 → (x + 4)(x − 1) = 0</p>
          <p className="font-hand text-2xl text-primary">jadi x = −4 atau x = 1 ✓</p>
        </div>
      </section>

      <section aria-labelledby="komponen" className="space-y-4">
        <h2 id="komponen" className="text-xl font-semibold">
          Tombol & status
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button className="h-touch px-5">Kumpulkan</Button>
          <Button className="h-touch px-5" variant="secondary">
            Simpan draf
          </Button>
          <Button className="h-touch px-5" variant="outline">
            Lewati
          </Button>
          <Button className="h-touch px-5" variant="destructive">
            Hapus coretan
          </Button>
          <Button className="h-touch px-5" variant="link">
            Lihat pembahasan
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-medium">
          <span className="rounded-full bg-success px-3 py-1 text-success-foreground">Benar</span>
          <span className="rounded-full bg-warning px-3 py-1 text-warning-foreground">
            Perlu dicek
          </span>
          <span className="text-success">Teks sukses</span>
          <span className="text-warning">Teks perhatian</span>
          <span className="text-destructive">Teks galat</span>
        </div>
      </section>

      <section aria-labelledby="sentuh" className="space-y-4">
        <h2 id="sentuh" className="text-xl font-semibold">
          Target sentuh
        </h2>
        <div className="flex items-center gap-4">
          <div
            className="grid size-touch place-items-center rounded-lg border-2 border-dashed border-primary text-xs font-semibold text-primary"
            aria-hidden
          >
            44
          </div>
          <p className="text-muted-foreground">
            Token <code className="text-foreground">--spacing-touch</code> = 44 px. Pakai{" "}
            <code className="text-foreground">size-touch</code>,{" "}
            <code className="text-foreground">h-touch</code>, atau{" "}
            <code className="text-foreground">min-h-touch</code> untuk setiap elemen yang disentuh.
          </p>
        </div>
      </section>
    </main>
  );
}
