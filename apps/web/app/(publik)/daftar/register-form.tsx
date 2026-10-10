"use client";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MailCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

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
import { type FieldErrors, fieldErrors, signUpSchema } from "@/lib/auth/schemas";
import { CONSENT_VERSION, consentText } from "@/lib/consent";

import { signInWithGoogle } from "../masuk/actions";
import { type SignUpState, signUp } from "./actions";

const planLabels: Record<string, string> = {
  monthly: "Paket Bulanan (Rp29.900 / bln)",
  semester: "Paket Semester (Rp149.000 / 6 bln)",
  annual: "Paket Tahunan (Rp249.000 / thn)",
};

const initialState: SignUpState = { status: "idle" };

export interface RegisterFormProps {
  paket: string;
  googleEnabled: boolean;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[11px] font-medium text-destructive">
      {message}
    </p>
  );
}

export function RegisterForm({ paket, googleEnabled }: RegisterFormProps) {
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    password: "",
    confirmPassword: "",
    examGoal: "utbk",
    consent: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  const errors = Object.keys(clientErrors).length > 0 ? clientErrors : (state.errors ?? {});
  const planLabel = planLabels[paket] ?? planLabels.monthly;

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (clientErrors[key]) setClientErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const result = signUpSchema.safeParse({
      ...values,
      consent: values.consent ? "on" : undefined,
    });
    if (!result.success) {
      event.preventDefault();
      setClientErrors(fieldErrors(result.error));
      return;
    }
    setClientErrors({});
  };

  if (state.status === "check-email") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col px-4 py-12">
        <Card className="border-border/80 shadow-md">
          <CardHeader className="space-y-2 text-center">
            <MailCheck className="mx-auto size-10 text-primary" aria-hidden />
            <CardTitle className="font-heading text-2xl font-bold">Periksa Email Anda</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Kami mengirim tautan konfirmasi ke <strong>{values.email}</strong>. Buka tautan itu
              untuk mengaktifkan akun, lalu tambahkan akun anak Anda.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center border-t border-border/60 bg-muted/20 py-4">
            <Link href="/masuk" className="text-xs font-semibold text-primary underline">
              Kembali ke halaman masuk
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8 sm:py-12">
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
            Sebagai orang tua/wali, Anda akan menerima laporan kemajuan mingguan dan membuat akun
            belajar untuk anak setelah mendaftar.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <User className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Informasi Orang Tua / Wali
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="parent-name" className="text-xs font-semibold text-foreground">
                    Nama Lengkap Orang Tua <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="parent-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Contoh: Rina Wulandari"
                    value={values.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? "parent-name-error" : undefined}
                    className="text-xs sm:text-sm"
                  />
                  <FieldError id="parent-name-error" message={errors.fullName} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="parent-email" className="text-xs font-semibold text-foreground">
                    Email Orang Tua <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="parent-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="orangtua@contoh.com"
                      value={values.email}
                      onChange={(e) => update("email", e.target.value)}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "parent-email-error" : undefined}
                      className="pl-9 text-xs sm:text-sm"
                    />
                  </div>
                  <FieldError id="parent-email-error" message={errors.email} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="parent-wa" className="text-xs font-semibold text-foreground">
                    Nomor WhatsApp <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="parent-wa"
                      name="whatsapp"
                      type="tel"
                      autoComplete="tel"
                      placeholder="081234567890"
                      value={values.whatsapp}
                      onChange={(e) => update("whatsapp", e.target.value)}
                      aria-invalid={Boolean(errors.whatsapp)}
                      aria-describedby={errors.whatsapp ? "parent-wa-error" : undefined}
                      className="pl-9 text-xs sm:text-sm"
                    />
                  </div>
                  <FieldError id="parent-wa-error" message={errors.whatsapp} />
                </div>

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
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Minimal 8 karakter"
                      value={values.password}
                      onChange={(e) => update("password", e.target.value)}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? "parent-password-error" : undefined}
                      className="pl-9 pr-10 text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <FieldError id="parent-password-error" message={errors.password} />
                </div>

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
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Ulangi kata sandi"
                      value={values.confirmPassword}
                      onChange={(e) => update("confirmPassword", e.target.value)}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={
                        errors.confirmPassword ? "confirm-password-error" : undefined
                      }
                      className="pl-9 text-xs sm:text-sm"
                    />
                  </div>
                  <FieldError id="confirm-password-error" message={errors.confirmPassword} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <Target className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Target Ujian Anak
                </h3>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="exam-goal" className="text-xs font-semibold text-foreground">
                  Anak Anda sedang bersiap untuk <span className="text-destructive">*</span>
                </label>
                <select
                  id="exam-goal"
                  name="examGoal"
                  value={values.examGoal}
                  onChange={(e) => update("examGoal", e.target.value)}
                  aria-invalid={Boolean(errors.examGoal)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs sm:text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <option value="utbk">UTBK-SNBT (masuk perguruan tinggi)</option>
                  <option value="tka">TKA (Tes Kemampuan Akademik)</option>
                  <option value="both">Keduanya (TKA dan UTBK)</option>
                </select>
                <FieldError id="exam-goal-error" message={errors.examGoal} />
                <p className="text-[11px] text-muted-foreground">
                  Akun anak Anda buat setelah mendaftar, di halaman Anak.
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    3. {consentText.title}
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {CONSENT_VERSION}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{consentText.intro}</p>
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
              <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  name="consent"
                  checked={values.consent}
                  onChange={(e) => update("consent", e.target.checked)}
                  aria-invalid={Boolean(errors.consent)}
                  aria-describedby={errors.consent ? "consent-error" : undefined}
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
                  belajar anak seperti di atas sesuai UU Pelindungan Data Pribadi (UU PDP).
                </span>
              </label>
              <FieldError id="consent-error" message={errors.consent} />
            </div>

            {state.status === "error" && state.message && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {state.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full min-h-touch font-bold shadow-xs gap-2"
            >
              {isPending ? (
                <span>Menyiapkan Akun...</span>
              ) : (
                <>
                  <span>Daftar &amp; Mulai Uji Coba Gratis</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {googleEnabled && (
            <form action={signInWithGoogle} className="mt-3">
              <input type="hidden" name="next" value="/ortu/anak" />
              <Button type="submit" variant="outline" className="w-full min-h-touch font-semibold">
                Daftar dengan Google
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Setelah masuk dengan Google, Anda akan diminta membaca dan menyetujui teks
                persetujuan di atas.
              </p>
            </form>
          )}
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
