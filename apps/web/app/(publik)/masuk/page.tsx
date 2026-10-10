import { isGoogleAuthEnabled } from "@/lib/auth/origin-server";

import { LoginForm, type LoginFormProps } from "./login-form";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const notices: Record<string, LoginFormProps["notice"]> = {
  tautan: {
    tone: "error",
    text: "Tautan masuk tidak valid atau sudah kedaluwarsa. Silakan masuk lagi.",
  },
  google: {
    tone: "error",
    text: "Masuk dengan Google belum berhasil. Coba lagi atau gunakan email.",
  },
};

export default async function LoginPage({ searchParams }: PageProps<"/masuk">) {
  const params = await searchParams;
  const error = first(params.galat);
  const notice =
    (error && notices[error]) ||
    (first(params.keluar) === "1"
      ? ({ tone: "info", text: "Anda sudah keluar dari Coreta." } as const)
      : first(params.next)
        ? ({ tone: "info", text: "Silakan masuk untuk membuka halaman itu." } as const)
        : undefined);

  return (
    <LoginForm next={first(params.next)} googleEnabled={isGoogleAuthEnabled()} notice={notice} />
  );
}
