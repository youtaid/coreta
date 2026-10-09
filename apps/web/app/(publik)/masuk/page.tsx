"use client";

import { Eye, EyeOff, Lock, LogIn, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"ortu" | "siswa">("ortu");

  // Form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Errors state
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier =
        role === "ortu"
          ? "Email orang tua wajib diisi."
          : "Nama pengguna atau email siswa wajib diisi.";
    } else if (role === "ortu" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      newErrors.identifier = "Format email tidak valid (contoh: nama@domain.com).";
    }

    if (!password) {
      newErrors.password = "Kata sandi wajib diisi.";
    } else if (password.length < 6) {
      newErrors.password = "Kata sandi minimal 6 karakter.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulated auth handshake
    setTimeout(() => {
      setIsSubmitting(false);
      toast.add({
        type: "success",
        title: "Berhasil masuk",
        description: `Selamat datang kembali di Coreta (${role === "ortu" ? "Portal Orang Tua" : "Ruang Siswa"}).`,
      });

      if (role === "ortu") {
        router.push("/ortu/laporan");
      } else {
        router.push("/belajar");
      }
    }, 400);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-8 sm:py-16">
      <Card className="border-border/80 shadow-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="font-heading text-2xl font-bold">Masuk ke Coreta</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Pilih peran Anda untuk mengakses worksheet matematika atau laporan mingguan anak.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs
            value={role}
            onValueChange={(val) => {
              setRole(val as "ortu" | "siswa");
              setErrors({});
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="ortu" className="text-xs font-semibold py-2">
                Orang Tua / Wali
              </TabsTrigger>
              <TabsTrigger value="siswa" className="text-xs font-semibold py-2">
                Siswa
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Identifier input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-identifier"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span>{role === "ortu" ? "Email Orang Tua" : "Nama Pengguna / Email Siswa"}</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    {role === "ortu" ? <Mail className="size-4" /> : <User className="size-4" />}
                  </div>
                  <Input
                    id="login-identifier"
                    type={role === "ortu" ? "email" : "text"}
                    placeholder={role === "ortu" ? "orangtua@contoh.com" : "budi_pratama"}
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errors.identifier)
                        setErrors((prev) => ({ ...prev, identifier: undefined }));
                    }}
                    aria-invalid={Boolean(errors.identifier)}
                    aria-describedby={errors.identifier ? "identifier-error" : undefined}
                    className="pl-9 text-xs sm:text-sm"
                  />
                </div>
                {errors.identifier && (
                  <p id="identifier-error" className="text-[11px] font-medium text-destructive">
                    {errors.identifier}
                  </p>
                )}
              </div>

              {/* Password input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-semibold text-foreground">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      toast.add({
                        type: "info",
                        title: "Pemulihan Kata Sandi",
                        description:
                          "Tautan reset kata sandi akan dikirim ke email terdaftar (tersedia saat auth terhubung).",
                      })
                    }
                    className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <Lock className="size-4" />
                  </div>
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className="pl-9 pr-10 text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-[11px] font-medium text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-touch font-bold shadow-xs gap-2 mt-2"
              >
                {isSubmitting ? (
                  <span>Memeriksa Akun...</span>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    <span>Masuk sebagai {role === "ortu" ? "Orang Tua" : "Siswa"}</span>
                  </>
                )}
              </Button>
            </form>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center border-t border-border/60 bg-muted/20 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Belum memiliki akun Coreta?{" "}
            <Link
              href="/daftar"
              className="font-semibold text-primary underline underline-offset-4"
            >
              Daftar gratis di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
