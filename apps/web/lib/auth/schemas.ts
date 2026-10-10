import { z } from "zod";

/** Minimal 8 karakter, sama dengan auth.minimum_password_length di supabase/config.toml. */
export const MIN_PASSWORD_LENGTH = 8;

const email = z
  .string({ error: "Email wajib diisi." })
  .trim()
  .min(1, "Email wajib diisi.")
  .pipe(z.email({ error: "Format email tidak valid (contoh: nama@domain.com)." }))
  .transform((value) => value.toLowerCase());

export const signInSchema = z.object({
  email,
  password: z.string({ error: "Kata sandi wajib diisi." }).min(1, "Kata sandi wajib diisi."),
  next: z.string().optional(),
});

export const examGoals = ["tka", "utbk", "both"] as const;

export const signUpSchema = z
  .object({
    fullName: z
      .string({ error: "Nama lengkap orang tua wajib diisi." })
      .trim()
      .min(1, "Nama lengkap orang tua wajib diisi.")
      .max(120, "Nama terlalu panjang."),
    email,
    whatsapp: z
      .string({ error: "Nomor WhatsApp orang tua wajib diisi." })
      .trim()
      .min(1, "Nomor WhatsApp orang tua wajib diisi.")
      .transform((value) => value.replace(/[\s-]/g, ""))
      .pipe(
        z
          .string()
          .regex(/^(\+62|62|0)8\d{7,12}$/, "Nomor WhatsApp tidak valid (contoh: 081234567890)."),
      ),
    password: z
      .string({ error: "Kata sandi wajib diisi." })
      .min(MIN_PASSWORD_LENGTH, `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`)
      .max(72, "Kata sandi maksimal 72 karakter."),
    confirmPassword: z.string({ error: "Konfirmasi kata sandi wajib diisi." }),
    examGoal: z.enum(examGoals, { error: "Pilih target ujian anak." }),
    consent: z.literal("on", {
      error: "Anda wajib menyetujui pemrosesan data anak untuk melanjutkan.",
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi kata sandi tidak cocok.",
  });

export type FieldErrors = Partial<Record<string, string>>;

/** Pesan galat pertama untuk setiap isian, siap ditampilkan di bawah input. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}

export function formValues(formData: FormData, keys: readonly string[]) {
  return Object.fromEntries(
    keys.map((key) => {
      const value = formData.get(key);
      return [key, typeof value === "string" ? value : undefined];
    }),
  );
}
