"use server";

import { redirect } from "next/navigation";

import { consentLinkFor, recordConsent } from "@/lib/auth/consent-server";
import { requestOrigin } from "@/lib/auth/origin-server";
import { type FieldErrors, fieldErrors, formValues, signUpSchema } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/server";

export interface SignUpState {
  status: "idle" | "error" | "check-email";
  message?: string;
  errors?: FieldErrors;
}

const signUpFields = [
  "fullName",
  "email",
  "whatsapp",
  "password",
  "confirmPassword",
  "examGoal",
  "consent",
] as const;

/**
 * Pendaftaran orang tua: akun Supabase Auth (peran orang tua dari trigger 0001), lalu persetujuan
 * data anak dicatat server beserta versinya. Akun siswa dibuat orang tua di /ortu/anak.
 */
export async function signUp(_previous: SignUpState, formData: FormData): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse(formValues(formData, signUpFields));
  if (!parsed.success) {
    return { status: "error", errors: fieldErrors(parsed.error) };
  }
  const input = parsed.data;

  const callback = new URL("/auth/callback", await requestOrigin());
  callback.searchParams.set("next", "/ortu/anak");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      // user_metadata diisi pendaftar sendiri: hanya untuk data tampilan, tidak pernah untuk peran.
      data: { full_name: input.fullName, whatsapp: input.whatsapp, exam_goal: input.examGoal },
      emailRedirectTo: callback.toString(),
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return {
        status: "error",
        errors: { email: "Email ini sudah terdaftar. Silakan masuk." },
      };
    }
    if (error.code === "weak_password") {
      return {
        status: "error",
        errors: { password: "Kata sandi terlalu lemah. Gunakan kombinasi huruf dan angka." },
      };
    }
    if (error.status === 429) {
      return {
        status: "error",
        message: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
      };
    }
    console.error("[daftar] pendaftaran gagal", error.code, error.message);
    return { status: "error", message: "Pendaftaran belum berhasil. Coba lagi sebentar lagi." };
  }

  // Bila konfirmasi email aktif dan email sudah terdaftar, Supabase mengembalikan pengguna palsu
  // tanpa identitas. Jawabannya dibuat sama dengan pendaftaran baru agar akun tidak bisa ditebak.
  const user = data.user;
  if (!user || (user.identities?.length ?? 0) === 0) {
    return { status: "check-email" };
  }

  const consent = await recordConsent({
    parentId: user.id,
    type: "data_anak",
    granted: true,
    actorId: user.id,
    source: "daftar",
  });
  if (consent.error) {
    // Akun sudah dibuat; persetujuan diminta ulang lewat halaman persetujuan setelah masuk.
    console.error("[daftar] persetujuan gagal dicatat", consent.error.code);
  }

  if (!data.session) {
    return { status: "check-email" };
  }
  redirect(consent.error ? consentLinkFor(user.id) : "/ortu/anak");
}
