"use client";

import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone, Sparkles, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

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
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paketParam = searchParams.get("paket") || "monthly";

  // Form states
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentWhatsapp, setParentWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [studentName, setStudentName] = useState("");
  const [studentGrade, setStudentGrade] = useState("12");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!parentName.trim()) {
      newErrors.parentName = "Nama lengkap orang tua wajib diisi.";
    }

    if (!parentEmail.trim()) {
      newErrors.parentEmail = "Email orang tua wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
      newErrors.parentEmail = "Format email tidak valid (contoh: nama@domain.com).";
    }

    if (!parentWhatsapp.trim()) {
      newErrors.parentWhatsapp = "Nomor WhatsApp orang tua wajib diisi.";
    } else if (!/^[0-9+-\s]{9,16}$/.test(parentWhatsapp)) {
      newErrors.parentWhatsapp = "Nomor WhatsApp harus berupa angka valid (min. 10 digit).";
    }

    if (!password) {
      newErrors.password = "Kata sandi wajib diisi.";
    } else if (password.length < 8) {
      newErrors.password = "Kata sandi minimal 8 karakter.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi kata sandi wajib diisi.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi kata sandi tidak cocok.";
    }

    if (!studentName.trim()) {
      newErrors.studentName = "Nama anak (siswa) wajib diisi.";
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = "Anda wajib menyetujui Ketentuan Layanan & Perlindungan Data Anak.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      toast.add({
        type: "success",
        title: "Pendaftaran Berhasil!",
        description: `Akun orang tua dan profil siswa untuk ${studentName} telah disiapkan. Lanjutkan ke verifikasi persetujuan.`,
      });

      // Redirect to parental consent page with token
      router.push("/persetujuan/demo-persetujuan");
    }, 450);
  };

  const planLabel =
    paketParam === "semester"
      ? "Paket Semester (Rp149.000 / 6 bln)"
      : paketParam === "annual"
        ? "Paket Tahunan (Rp249.000 / thn)"
        : "Paket Bulanan (Rp29.900 / bln)";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8 sm:py-12">
      {/* Trial Promo Banner */}
      <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 p-4 sm:p-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-foreground text-sm">
            <Sparkles className="size-4 text-primary" />
            <span>Mulai Uji Coba Gratis 7 Hari</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Paket terpilih: <strong className="text-foreground">{planLabel}</strong>. Biaya Rp0
            selama 7 hari pertama. Tidak dipungut biaya sebelum masa uji coba selesai.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs font-semibold">
          Gratis 7 Hari
        </Badge>
      </div>

      <Card className="border-border/80 shadow-md">
        <CardHeader className="space-y-1.5 pb-4">
          <CardTitle className="font-heading text-2xl font-bold">Daftar Akun Orang Tua</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Sebagai orang tua/wali, Anda akan menerima laporan kemajuan mingguan dan mengelola
            profil belajar anak.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Bagian 1: Data Orang Tua */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <User className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Informasi Orang Tua / Wali
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Nama Orang Tua */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="parent-name" className="text-xs font-semibold text-foreground">
                    Nama Lengkap Orang Tua <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="parent-name"
                    type="text"
                    placeholder="Contoh: Rina Wulandari"
                    value={parentName}
                    onChange={(e) => {
                      setParentName(e.target.value);
                      if (errors.parentName) setErrors((prev) => ({ ...prev, parentName: "" }));
                    }}
                    aria-invalid={Boolean(errors.parentName)}
                    className="text-xs sm:text-sm"
                  />
                  {errors.parentName && (
                    <p className="text-[11px] font-medium text-destructive">{errors.parentName}</p>
                  )}
                </div>

                {/* Email Orang Tua */}
                <div className="space-y-1.5">
                  <label htmlFor="parent-email" className="text-xs font-semibold text-foreground">
                    Email Orang Tua <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="parent-email"
                      type="email"
                      placeholder="orangtua@contoh.com"
                      value={parentEmail}
                      onChange={(e) => {
                        setParentEmail(e.target.value);
                        if (errors.parentEmail) setErrors((prev) => ({ ...prev, parentEmail: "" }));
                      }}
                      aria-invalid={Boolean(errors.parentEmail)}
                      className="pl-9 text-xs sm:text-sm"
                    />
                  </div>
                  {errors.parentEmail && (
                    <p className="text-[11px] font-medium text-destructive">{errors.parentEmail}</p>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <label htmlFor="parent-wa" className="text-xs font-semibold text-foreground">
                    Nomor WhatsApp <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="parent-wa"
                      type="tel"
                      placeholder="081234567890"
                      value={parentWhatsapp}
                      onChange={(e) => {
                        setParentWhatsapp(e.target.value);
                        if (errors.parentWhatsapp)
                          setErrors((prev) => ({ ...prev, parentWhatsapp: "" }));
                      }}
                      aria-invalid={Boolean(errors.parentWhatsapp)}
                      className="pl-9 text-xs sm:text-sm"
                    />
                  </div>
                  {errors.parentWhatsapp && (
                    <p className="text-[11px] font-medium text-destructive">
                      {errors.parentWhatsapp}
                    </p>
                  )}
                </div>

                {/* Kata Sandi */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="parent-password"
                    className="text-xs font-semibold text-foreground"
                  >
                    Kata Sandi <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="parent-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      aria-invalid={Boolean(errors.password)}
                      className="pl-9 pr-10 text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] font-medium text-destructive">{errors.password}</p>
                  )}
                </div>

                {/* Konfirmasi Sandi */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirm-password"
                    className="text-xs font-semibold text-foreground"
                  >
                    Konfirmasi Kata Sandi <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ulangi kata sandi"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword)
                          setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                      }}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      className="pl-9 text-xs sm:text-sm"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[11px] font-medium text-destructive">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bagian 2: Profil Siswa (Anak) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <UserPlus className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Profil Awal Siswa (Anak)
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Nama Anak */}
                <div className="space-y-1.5">
                  <label htmlFor="student-name" className="text-xs font-semibold text-foreground">
                    Nama Panggilan Anak <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="student-name"
                    type="text"
                    placeholder="Contoh: Budi Pratama"
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      if (errors.studentName) setErrors((prev) => ({ ...prev, studentName: "" }));
                    }}
                    aria-invalid={Boolean(errors.studentName)}
                    className="text-xs sm:text-sm"
                  />
                  {errors.studentName && (
                    <p className="text-[11px] font-medium text-destructive">{errors.studentName}</p>
                  )}
                </div>

                {/* Jenjang Kelas */}
                <div className="space-y-1.5">
                  <label htmlFor="student-grade" className="text-xs font-semibold text-foreground">
                    Jenjang Sekolah Saat Ini <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="student-grade"
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs sm:text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <option value="10">Kelas 10 SMA (Fase E)</option>
                    <option value="11">Kelas 11 SMA (Fase F)</option>
                    <option value="12">Kelas 12 SMA (Persiapan UTBK)</option>
                    <option value="gap-year">Alumni / Gap Year (Fokus UTBK)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bagian 3: Persetujuan PDP / COPPA */}
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (errors.agreeTerms) setErrors((prev) => ({ ...prev, agreeTerms: "" }));
                  }}
                  className="mt-0.5 size-4 rounded-sm border-input text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Saya menyetujui{" "}
                  <Link href="/ketentuan" className="font-semibold text-foreground underline">
                    Ketentuan Layanan
                  </Link>{" "}
                  dan{" "}
                  <Link href="/privasi" className="font-semibold text-foreground underline">
                    Kebijakan Privasi
                  </Link>{" "}
                  Coreta, serta memberikan persetujuan selaku orang tua/wali untuk pemrosesan data
                  belajar anak sesuai UU Pelindungan Data Pribadi (UU PDP).
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="text-[11px] font-medium text-destructive pl-7">{errors.agreeTerms}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-touch font-bold shadow-xs gap-2"
            >
              {isSubmitting ? (
                <span>Menyiapkan Akun...</span>
              ) : (
                <>
                  <span>Daftar &amp; Mulai Uji Coba Gratis</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center border-t border-border/60 bg-muted/20 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Sudah memiliki akun terdaftar?{" "}
            <Link href="/masuk" className="font-semibold text-primary underline underline-offset-4">
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-md items-center justify-center p-12 text-sm text-muted-foreground">
          Memuat formulir pendaftaran...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
