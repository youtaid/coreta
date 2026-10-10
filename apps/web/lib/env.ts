import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function parseEnv<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(`Variabel lingkungan tidak valid:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

let publicEnv: PublicEnv | undefined;
let serverEnv: ServerEnv | undefined;

// NEXT_PUBLIC_* must be referenced literally so Next.js can inline them into the browser bundle.
export function getPublicEnv(): PublicEnv {
  publicEnv ??= parseEnv(publicEnvSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  return publicEnv;
}

export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() hanya boleh dipanggil di server.");
  }
  serverEnv ??= parseEnv(serverEnvSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  return serverEnv;
}

let studentPinPepper: string | undefined;

/**
 * Kunci rahasia untuk menurunkan kata sandi Auth siswa dari PIN (Fase 36). Terpisah dari
 * getServerEnv() agar bagian lain server tetap berjalan bila fitur ini belum dikonfigurasi.
 * Lokal: sama dengan student_pin_pepper di packages/content/seed/families.json.
 */
export function getStudentPinPepper(): string {
  if (typeof window !== "undefined") {
    throw new Error("getStudentPinPepper() hanya boleh dipanggil di server.");
  }
  studentPinPepper ??= parseEnv(z.object({ STUDENT_PIN_PEPPER: z.string().min(16) }), {
    STUDENT_PIN_PEPPER: process.env.STUDENT_PIN_PEPPER,
  }).STUDENT_PIN_PEPPER;
  return studentPinPepper;
}
