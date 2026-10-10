"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Lock,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
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
import { toast } from "@/components/ui/toast";
import { consentText } from "@/lib/consent";

export type ConsentDecision = "pending" | "approved" | "rejected";

export interface ConsentChild {
  name: string;
  goal: string;
}

export interface ConsentViewProps {
  token: string;
  version: string;
  parentName: string;
  parentEmail: string;
  childrenList: ConsentChild[];
  initialDecision: ConsentDecision;
}

const goalLabels: Record<string, string> = {
  tka: "TKA",
  utbk: "UTBK-SNBT",
  both: "TKA dan UTBK-SNBT",
};

export function ConsentView({
  token,
  version,
  parentName,
  parentEmail,
  childrenList,
  initialDecision,
}: ConsentViewProps) {
  const [status, setStatus] = useState<ConsentDecision>(initialDecision);
  const [isProcessing, setIsProcessing] = useState(false);

  async function decide(granted: boolean) {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, type: "data_anak", granted }),
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!response.ok || !result?.ok) {
        toast.add({
          type: "destructive",
          title: "Keputusan belum tersimpan",
          description: result?.error ?? "Coba lagi sebentar lagi.",
        });
        return;
      }
      setStatus(granted ? "approved" : "rejected");
      toast.add(
        granted
          ? {
              type: "success",
              title: "Persetujuan Diterima",
              description: "Anda sekarang dapat membuat akun belajar untuk anak di halaman Anak.",
            }
          : {
              type: "destructive",
              title: "Persetujuan Ditolak",
              description: "Data belajar anak tidak akan diproses dan akun anak tidak diaktifkan.",
            },
      );
    } catch {
      toast.add({
        type: "destructive",
        title: "Koneksi terputus",
        description: "Keputusan belum tersimpan. Periksa koneksi lalu coba lagi.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8 sm:py-12">
      <Card className="border-border/80 shadow-md">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant={
                status === "approved"
                  ? "success"
                  : status === "rejected"
                    ? "destructive"
                    : "secondary"
              }
              className="gap-1.5 text-xs font-semibold"
            >
              <ShieldCheck className="size-3.5" />
              <span>
                {status === "approved"
                  ? "Persetujuan Diberikan"
                  : status === "rejected"
                    ? "Persetujuan Ditolak"
                    : "Menunggu Persetujuan Orang Tua"}
              </span>
            </Badge>
            <span className="font-mono text-[11px] text-muted-foreground">Versi: {version}</span>
          </div>

          <CardTitle className="font-heading text-2xl font-bold">{consentText.title}</CardTitle>
          <CardDescription className="text-xs sm:text-sm leading-relaxed">
            {consentText.intro}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === "approved" ? (
            <div
              role="status"
              className="rounded-xl border border-success/40 bg-success/10 p-5 flex items-start gap-4 animate-in fade-in"
            >
              <CheckCircle2 className="size-6 text-success shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="font-heading text-sm font-bold text-foreground">
                  Persetujuan Tercatat
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Terima kasih. Persetujuan Anda tersimpan bersama versi teksnya. Anda dapat membuat
                  dan mengelola akun belajar anak di portal orang tua.
                </p>
                <div className="pt-2">
                  <Link
                    href="/ortu/anak"
                    className={buttonVariants({ className: "min-h-touch gap-2 text-xs font-bold" })}
                  >
                    <span>Lanjut ke Profil Anak</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : status === "rejected" ? (
            <div
              role="status"
              className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 flex items-start gap-4 animate-in fade-in"
            >
              <XCircle className="size-6 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="font-heading text-sm font-bold text-foreground">
                  Persetujuan Izin Ditolak
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Anda memilih untuk tidak memberikan izin. Data belajar anak tidak akan diproses
                  dan akun anak tidak diaktifkan. Anda dapat mengubah keputusan kapan saja.
                </p>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setStatus("pending")}
                    className="min-h-touch text-xs font-semibold"
                  >
                    <span>Tinjau Ulang Izin</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <User className="size-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Data Wali dan Anak
              </h2>
            </div>

            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Nama Wali:</span>
                <p className="font-bold text-foreground">{parentName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email Wali Terdaftar:</span>
                <p className="font-medium text-foreground">{parentEmail}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Anak Terhubung:</span>
                {childrenList.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {childrenList.map((child) => (
                      <li key={child.name} className="font-bold text-foreground">
                        {child.name}{" "}
                        <span className="font-medium text-muted-foreground">
                          (target {goalLabels[child.goal] ?? child.goal})
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-medium text-foreground">
                    Belum ada. Akun anak dibuat setelah persetujuan, di halaman Anak.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ruang Lingkup Pemrosesan Data yang Disetujui
              </h2>
            </div>

            <ul className="space-y-2 text-xs text-muted-foreground">
              {consentText.points.map((point) => (
                <li key={point.title} className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>{point.title}:</strong> {point.body}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {status === "pending" && (
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                type="button"
                onClick={() => decide(true)}
                disabled={isProcessing}
                className="w-full sm:flex-1 min-h-touch font-bold shadow-xs gap-2"
              >
                {isProcessing ? (
                  <span>Memproses Persetujuan...</span>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>Setujui &amp; Aktifkan Akun Siswa</span>
                  </>
                )}
              </Button>

              <Dialog>
                <DialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isProcessing}
                      className="w-full sm:w-auto min-h-touch text-xs font-semibold text-destructive hover:bg-destructive/10"
                    />
                  }
                >
                  <XCircle className="size-4 mr-1.5" />
                  <span>Tolak Izin</span>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="size-5" />
                      <span>Konfirmasi Penolakan Izin</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      Jika Anda menolak, anak Anda tidak akan dapat mengakses ruang coret digital
                      dan worksheet Coreta. Anda yakin ingin menolak persetujuan ini?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2">
                    <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
                    <DialogClose
                      render={<Button variant="destructive" onClick={() => decide(false)} />}
                    >
                      Ya, Tolak Izin
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border/60 bg-muted/20 py-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="size-3 text-muted-foreground" />
            <span>Kepatuhan UU PDP</span>
          </span>
          <Link href="/masuk" className="hover:underline">
            Masuk ke Coreta
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export function InvalidConsentLink({ expired }: { expired: boolean }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-12">
      <Card className="border-border/80 shadow-md">
        <CardHeader className="space-y-2 text-center">
          <AlertTriangle className="mx-auto size-10 text-destructive" aria-hidden />
          <CardTitle className="font-heading text-2xl font-bold">
            {expired ? "Tautan Persetujuan Kedaluwarsa" : "Tautan Persetujuan Tidak Valid"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {expired
              ? "Tautan ini sudah lewat masa berlakunya atau teks persetujuan sudah diperbarui. Masuk ke akun orang tua untuk mendapatkan tautan baru."
              : "Tautan ini tidak dikenali. Pastikan Anda membuka tautan lengkap dari email atau pesan Coreta."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center border-t border-border/60 bg-muted/20 py-4">
          <Link href="/masuk" className={buttonVariants({ className: "min-h-touch" })}>
            Masuk ke Coreta
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
