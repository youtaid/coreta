import { ArrowRight, Pencil, Send } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { DomainGallery } from "./domain-gallery";
import { Section } from "./section";
import { ToastDemo } from "./toast-demo";
import { WorkspaceGallery } from "./workspace-gallery";

export const metadata: Metadata = {
  title: "Galeri Komponen — Coreta",
  robots: { index: false, follow: false },
};

export default function ComponentGalleryPage() {
  // Developer tool only; production builds answer 404.
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-10">
      <header className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Dev</p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Galeri Komponen</h1>
          <p className="max-w-2xl text-muted-foreground">
            Komponen dasar dari <code>components/ui</code>, komponen domain dari{" "}
            <code>components/domain</code>, dan komponen ruang kerja dari{" "}
            <code>components/workspace</code> dengan data tiruan. Cek tiap komponen di tema terang
            dan gelap, lalu tekan Tab untuk melihat fokus papan ketik.
          </p>
          <nav aria-label="Bagian galeri" className="flex flex-wrap gap-4 text-sm font-medium">
            <a href="#dasar" className="text-primary underline-offset-4 hover:underline">
              Komponen dasar
            </a>
            <a href="#domain" className="text-primary underline-offset-4 hover:underline">
              Komponen domain
            </a>
            <a href="#workspace" className="text-primary underline-offset-4 hover:underline">
              Komponen ruang kerja
            </a>
          </nav>
        </div>
        <ThemeToggle />
      </header>

      <p
        id="dasar"
        className="-mb-6 text-sm font-semibold tracking-wide text-muted-foreground uppercase"
      >
        Komponen dasar
      </p>

      <Section id="button" title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Kumpulkan</Button>
          <Button variant="secondary">Simpan draf</Button>
          <Button variant="outline">Lewati</Button>
          <Button variant="ghost">Batal</Button>
          <Button variant="destructive">Hapus coretan</Button>
          <Button variant="link">Lihat pembahasan</Button>
          <Button disabled>Nonaktif</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Kecil</Button>
          <Button>Bawaan</Button>
          <Button size="lg">Besar</Button>
          <Button>
            <Send data-icon="inline-start" aria-hidden />
            Kirim jawaban
          </Button>
          <Button variant="outline">
            Lanjut belajar
            <ArrowRight data-icon="inline-end" aria-hidden />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Pena (kecil)">
            <Pencil aria-hidden />
          </Button>
          <Button size="icon" variant="outline" aria-label="Pena">
            <Pencil aria-hidden />
          </Button>
          <Button size="icon-lg" aria-label="Pena (besar)">
            <Pencil aria-hidden />
          </Button>
        </div>
      </Section>

      <Section id="card" title="Card">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Worksheet Minggu 3</CardTitle>
              <CardDescription>Tahap 3 · Persamaan Kuadrat · 8 soal</CardDescription>
              <CardAction>
                <Badge variant="secondary">Baru</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p>Perkiraan waktu 25 menit. Kerjakan dengan mencoret langsung di layar.</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Mulai</Button>
            </CardFooter>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Kartu kecil</CardTitle>
              <CardDescription>Varian size=&quot;sm&quot; untuk daftar padat.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">82%</p>
              <p className="text-muted-foreground">Penguasaan rata-rata</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section id="badge" title="Badge">
        <div className="flex flex-wrap gap-2">
          <Badge>Aktif</Badge>
          <Badge variant="secondary">Uji coba</Badge>
          <Badge variant="success">Tuntas</Badge>
          <Badge variant="warning">Perlu dicek</Badge>
          <Badge variant="destructive">Gagal bayar</Badge>
          <Badge variant="outline">Terkunci</Badge>
        </div>
      </Section>

      <Section id="input" title="Input">
        <div className="grid max-w-md gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Email orang tua
            <Input type="email" placeholder="nama@contoh.com" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Jawaban isian
            <Input defaultValue="-4" aria-invalid />
            <span className="font-normal text-destructive">Masukkan bilangan bulat positif.</span>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Nonaktif
            <Input disabled placeholder="Tidak bisa diubah" />
          </label>
        </div>
      </Section>

      <Section id="tabs" title="Tabs">
        <Tabs defaultValue="minggu-ini" className="max-w-xl">
          <TabsList>
            <TabsTrigger value="minggu-ini">Minggu ini</TabsTrigger>
            <TabsTrigger value="ulang">Ulang berjarak</TabsTrigger>
            <TabsTrigger value="selesai">Selesai</TabsTrigger>
          </TabsList>
          <TabsContent value="minggu-ini">3 worksheet menunggu dikerjakan.</TabsContent>
          <TabsContent value="ulang">2 worksheet untuk diulang hari ini.</TabsContent>
          <TabsContent value="selesai">12 worksheet sudah selesai.</TabsContent>
        </Tabs>
        <Tabs defaultValue="laporan" className="max-w-xl">
          <TabsList variant="line">
            <TabsTrigger value="laporan">Laporan</TabsTrigger>
            <TabsTrigger value="anak">Profil anak</TabsTrigger>
          </TabsList>
          <TabsContent value="laporan">Varian garis.</TabsContent>
          <TabsContent value="anak">Profil anak.</TabsContent>
        </Tabs>
      </Section>

      <Section id="progress" title="Progress">
        <div className="grid max-w-md gap-6">
          <Progress value={0}>
            <ProgressLabel>Belum mulai</ProgressLabel>
            <ProgressValue />
          </Progress>
          <Progress value={45}>
            <ProgressLabel>Soal terjawab</ProgressLabel>
            <ProgressValue />
          </Progress>
          <Progress value={100}>
            <ProgressLabel>Tahap 2 tuntas</ProgressLabel>
            <ProgressValue />
          </Progress>
        </div>
      </Section>

      <Section id="dialog" title="Dialog">
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>Kumpulkan worksheet</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kumpulkan sekarang?</DialogTitle>
              <DialogDescription>
                Masih ada 2 soal kosong. Jawaban yang sudah dikumpulkan tidak bisa diubah.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Kembali</DialogClose>
              <DialogClose render={<Button />}>Kumpulkan</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section id="toast" title="Toast">
        <ToastDemo />
      </Section>

      <Section id="tooltip" title="Tooltip">
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" size="icon" aria-label="Pena" />}>
            <Pencil aria-hidden />
          </TooltipTrigger>
          <TooltipContent>Pena (P)</TooltipContent>
        </Tooltip>
      </Section>

      <Section id="skeleton" title="Skeleton">
        <div className="flex max-w-md items-center gap-4" aria-busy aria-label="Memuat">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </Section>
      <DomainGallery />
      <WorkspaceGallery />
    </main>
  );
}
