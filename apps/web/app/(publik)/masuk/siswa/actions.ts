"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { landingAfterSignIn } from "@/lib/auth/roles";
import { type FieldErrors, fieldErrors, formValues } from "@/lib/auth/schemas";
import { studentSignInSchema } from "@/lib/auth/student-schemas";
import { signInStudent } from "@/lib/auth/student-server";

export interface StudentSignInState {
  status: "idle" | "error";
  message?: string;
  errors?: FieldErrors;
  /** Kode yang diketik dikirim balik agar anak cukup mengetik ulang PIN. */
  code?: string;
}

const timeFormat = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

async function clientIp() {
  const list = await headers();
  return list.get("x-real-ip") ?? list.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function signInWithCode(
  _previous: StudentSignInState,
  formData: FormData,
): Promise<StudentSignInState> {
  const raw = formValues(formData, ["code", "pin", "next"]);
  const code = raw.code?.slice(0, 32);
  const parsed = studentSignInSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), code };

  const result = await signInStudent({
    code: parsed.data.code,
    pin: parsed.data.pin,
    ip: await clientIp(),
  });

  if (!result.ok) {
    return {
      status: "error",
      code,
      message:
        result.reason === "locked" && result.lockedUntil
          ? `Terlalu banyak percobaan. Coba lagi setelah pukul ${timeFormat.format(new Date(result.lockedUntil))} WIB, atau minta orang tua mengganti PIN.`
          : "Kode masuk atau PIN salah.",
    };
  }

  redirect(landingAfterSignIn("siswa", parsed.data.next));
}
