"use client";

import { Eye, EyeOff, Lock, LogIn, Mail, User } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

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
import { type FieldErrors, fieldErrors, signInSchema } from "@/lib/auth/schemas";

import { type SignInState, signIn, signInWithGoogle } from "./actions";

export interface LoginFormProps {
  next?: string;
  googleEnabled: boolean;
  notice?: { tone: "info" | "error"; text: string };
}

const initialState: SignInState = { status: "idle" };

export function LoginForm({ next, googleEnabled, notice }: LoginFormProps) {
  const [role, setRole] = useState<"ortu" | "siswa">("ortu");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  const errors = Object.keys(clientErrors).length > 0 ? clientErrors : (state.errors ?? {});
  const message = state.status === "error" ? state.message : undefined;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      event.preventDefault();
      setClientErrors(fieldErrors(result.error));
      return;
    }
    setClientErrors({});
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
          {notice && (
            <p
              role={notice.tone === "error" ? "alert" : "status"}
              className={
                notice.tone === "error"
                  ? "mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
                  : "mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground"
              }
            >
              {notice.text}
            </p>
          )}

          <Tabs
            value={role}
            onValueChange={(val) => {
              setRole(val as "ortu" | "siswa");
              setClientErrors({});
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

            <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-4">
              {next && <input type="hidden" name="next" value={next} />}

              <div className="space-y-1.5">
                <label htmlFor="login-identifier" className="text-xs font-semibold text-foreground">
                  {role === "ortu" ? "Email Orang Tua" : "Email Siswa"}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    {role === "ortu" ? <Mail className="size-4" /> : <User className="size-4" />}
                  </div>
                  <Input
                    id="login-identifier"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder={role === "ortu" ? "orangtua@contoh.com" : "siswa@contoh.com"}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (clientErrors.email)
                        setClientErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "identifier-error" : undefined}
                    className="pl-9 text-xs sm:text-sm"
                  />
                </div>
                {errors.email && (
                  <p id="identifier-error" className="text-[11px] font-medium text-destructive">
                    {errors.email}
                  </p>
                )}
                {role === "siswa" && (
                  <p className="text-[11px] text-muted-foreground">
                    Gunakan email dan kata sandi yang dibuatkan orang tua Anda.
                  </p>
                )}
              </div>

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
                          "Hubungi admin Coreta untuk mengatur ulang kata sandi. Reset mandiri lewat email segera hadir.",
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Kata sandi Anda"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (clientErrors.password)
                        setClientErrors((prev) => ({ ...prev, password: undefined }));
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

              {message && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {message}
                </p>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="w-full min-h-touch font-bold shadow-xs gap-2 mt-2"
              >
                {isPending ? (
                  <span>Memeriksa Akun...</span>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    <span>Masuk sebagai {role === "ortu" ? "Orang Tua" : "Siswa"}</span>
                  </>
                )}
              </Button>
            </form>

            {role === "ortu" && googleEnabled && (
              <form action={signInWithGoogle} className="mt-3">
                {next && <input type="hidden" name="next" value={next} />}
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full min-h-touch font-semibold"
                >
                  Masuk dengan Google
                </Button>
              </form>
            )}
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
