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
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function ConsentPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "demo-persetujuan";

  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStatus("approved");
      toast.add({
        type: "success",
        title: "Persetujuan Diterima",
        description:
          "Akun siswa telah aktif. Anda dapat langsung mengelola akun anak di portal orang tua.",
      });
    }, 400);
  };

  const handleReject = () => {
    setStatus("rejected");
    toast.add({
      type: "destructive",
      title: "Persetujuan Ditolak",
      description: "Izin pengolahan data siswa ditolak. Akun anak tidak akan diaktifkan.",
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8 sm:py-12">
      <Card className="border-border/80 shadow-md">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex items-center justify-between">
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

            <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[140px] sm:max-w-none">
              Token: {token}
            </span>
          </div>

          <CardTitle className="font-heading text-2xl font-bold">
            Persetujuan Wali: Pemrosesan Data Siswa
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm leading-relaxed">
            Sesuai regulasi UU Pelindungan Data Pribadi (UU PDP), Coreta mewajibkan persetujuan
            orang tua sebelum akun siswa di bawah umur diaktifkan.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Alert Banners */}
          {status === "approved" ? (
            <div className="rounded-xl border border-success/40 bg-success/10 p-5 flex items-start gap-4 animate-in fade-in">
              <CheckCircle2 className="size-6 text-success shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-heading text-sm font-bold text-foreground">
                  Akun Siswa Berhasil Diaktifkan
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Terima kasih atas persetujuan Anda. Profil anak telah terhubung dengan portal
                  orang tua dan siap mengakses seluruh worksheet mingguan Coreta.
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => router.push("/ortu/anak")}
                    className="min-h-touch gap-2 text-xs font-bold"
                  >
                    <span>Lanjut ke Profil Anak</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : status === "rejected" ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 flex items-start gap-4 animate-in fade-in">
              <XCircle className="size-6 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-heading text-sm font-bold text-foreground">
                  Persetujuan Izin Ditolak
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Anda telah memilih untuk tidak memberikan izin. Data siswa tidak akan diproses dan
                  akun anak tidak diaktifkan. Anda dapat mengubah keputusan kapan saja melalui
                  portal orang tua.
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

          {/* Student Profile Overview Card */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <User className="size-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Profil Siswa Terdaftar
              </h4>
            </div>

            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Nama Siswa:</span>
                <p className="font-bold text-foreground">Budi Pratama</p>
              </div>
              <div>
                <span className="text-muted-foreground">Jenjang Pendidikan:</span>
                <p className="font-bold text-foreground">Kelas 12 SMA (Fokus UTBK)</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email Wali Terdaftar:</span>
                <p className="font-medium text-foreground">orangtua@contoh.com</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tanggal Permohonan:</span>
                <p className="font-medium text-foreground">Hari ini, 07 Oktober 2026</p>
              </div>
            </div>
          </div>

          {/* Permissions & Data Scope */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ruang Lingkup Pemrosesan Data yang Disetujui
              </h4>
            </div>

            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Penyimpanan Coretan Digital:</strong> Koordinat goresan stylus disimpan
                  dalam format terkompresi untuk keperluan inferensi petunjuk penalaran matematika
                  oleh AI.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Penyusunan Laporan Belajar:</strong> Sistem menyusun rekap mingguan
                  persentase penguasaan kompetensi dan dikirimkan secara berkala ke email orang tua.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Jaminan Perlindungan Privasi:</strong> Data anak dienkripsi, tidak dipakai
                  untuk pelatihan model pihak ketiga yang tidak berizin, dan tidak pernah
                  diperjualbelikan.
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          {status === "pending" && (
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                type="button"
                onClick={handleApprove}
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
                    <DialogClose render={<Button variant="destructive" onClick={handleReject} />}>
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
            <span>Kepatuhan UU PDP &amp; COPPA</span>
          </span>
          <Link href="/bantuan" className="hover:underline">
            Butuh Bantuan?
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
