"use server";

import { redirect } from "next/navigation";

import { requestOrigin } from "@/lib/auth/origin-server";
import { type FieldErrors, fieldErrors, formValues, signInSchema } from "@/lib/auth/schemas";
import { destinationAfterSignIn } from "@/lib/auth/session-server";
import { createClient } from "@/lib/supabase/server";

export interface SignInState {
  status: "idle" | "error";
  message?: string;
  errors?: FieldErrors;
}

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse(formValues(formData, ["email", "password", "next"]));
  if (!parsed.success) {
    return { status: "error", errors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") {
      return {
        status: "error",
        message: "Email belum dikonfirmasi. Buka tautan konfirmasi yang kami kirim ke email Anda.",
      };
    }
    if (error?.status === 429) {
      return {
        status: "error",
        message: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
      };
    }
    // Pesan yang sama untuk email tidak terdaftar dan kata sandi salah (tidak membocorkan akun).
    return { status: "error", message: "Email atau kata sandi salah." };
  }

  const { to } = await destinationAfterSignIn(data.user, parsed.data.next);
  redirect(to);
}

export async function signInWithGoogle(formData: FormData) {
  const next = formData.get("next");
  const callback = new URL("/auth/callback", await requestOrigin());
  if (typeof next === "string" && next) callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });

  if (error || !data.url) redirect("/masuk?galat=google");
  redirect(data.url);
}
