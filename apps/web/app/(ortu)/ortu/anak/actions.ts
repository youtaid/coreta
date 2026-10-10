"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { type FieldErrors, fieldErrors, formValues } from "@/lib/auth/schemas";
import { currentUser } from "@/lib/auth/session-server";
import { createStudentAccount, resetStudentPin } from "@/lib/auth/student-server";
import {
  createStudentSchema,
  resetPinSchema,
  updateTargetsSchema,
} from "@/lib/auth/student-schemas";
import { createClient } from "@/lib/supabase/server";

export interface ChildActionState {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: FieldErrors;
  /** Hanya setelah akun dibuat: kode masuk untuk diberikan ke anak. */
  created?: { name: string; loginCode: string };
  /**
   * Isian yang bukan rahasia, dikirim balik agar formulir tidak kosong setelah ditolak (React
   * mengosongkan formulir setelah action selesai). PIN tidak pernah dikirim balik.
   */
  values?: Record<string, string | undefined>;
  /** Berganti di setiap jawaban agar formulir dipasang ulang dengan nilai di atas. */
  formKey?: string;
}

const notParent: ChildActionState = {
  status: "error",
  message: "Hanya orang tua atau wali yang dapat mengelola akun anak.",
};

/** Orang tua membuat akun siswa (kode masuk + PIN) lewat service role di server. */
export async function createStudent(
  _previous: ChildActionState,
  formData: FormData,
): Promise<ChildActionState> {
  const user = await currentUser();
  if (user?.role !== "ortu") return notParent;

  const raw = formValues(formData, [
    "fullName",
    "grade",
    "goal",
    "dailyTarget",
    "pin",
    "pinConfirm",
  ]);
  const values = {
    fullName: raw.fullName,
    grade: raw.grade,
    goal: raw.goal,
    dailyTarget: raw.dailyTarget,
  };
  const parsed = createStudentSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", errors: fieldErrors(parsed.error), values, formKey: randomUUID() };
  }

  const result = await createStudentAccount({ parentId: user.id, ...parsed.data });
  if (!result.ok) {
    return {
      status: "error",
      values,
      formKey: randomUUID(),
      message:
        result.reason === "no-consent"
          ? "Setujui dulu pemrosesan data anak sebelum membuat akun siswa."
          : "Akun siswa belum berhasil dibuat. Coba lagi sebentar lagi.",
    };
  }

  revalidatePath("/ortu/anak");
  return {
    status: "success",
    message: `Akun ${parsed.data.fullName} sudah dibuat.`,
    created: { name: parsed.data.fullName, loginCode: result.loginCode },
    formKey: randomUUID(),
  };
}

/**
 * Target harian dan target ujian diubah dengan sesi orang tua sendiri (bukan service role), jadi
 * kebijakan RLS students_update_guardian yang memutuskan: anak orang lain = 0 baris.
 */
export async function updateTargets(
  _previous: ChildActionState,
  formData: FormData,
): Promise<ChildActionState> {
  const user = await currentUser();
  if (user?.role !== "ortu") return notParent;

  const parsed = updateTargetsSchema.safeParse(
    formValues(formData, ["studentId", "goal", "dailyTarget"]),
  );
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .update({ goal: parsed.data.goal, daily_target: parsed.data.dailyTarget })
    .eq("id", parsed.data.studentId)
    .select("id");
  if (error) {
    console.error("[anak] target gagal disimpan", error.code);
    return { status: "error", message: "Target belum tersimpan. Coba lagi." };
  }
  if (!data?.length) return { status: "error", message: "Anak tidak ditemukan." };

  revalidatePath("/ortu/anak");
  return { status: "success", message: "Target tersimpan." };
}

export async function resetPin(
  _previous: ChildActionState,
  formData: FormData,
): Promise<ChildActionState> {
  const user = await currentUser();
  if (user?.role !== "ortu") return notParent;

  const parsed = resetPinSchema.safeParse(formValues(formData, ["studentId", "pin", "pinConfirm"]));
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error) };

  const result = await resetStudentPin({
    parentId: user.id,
    studentId: parsed.data.studentId,
    pin: parsed.data.pin,
  });
  if (!result.ok) {
    return {
      status: "error",
      message:
        result.reason === "not-found"
          ? "Anak tidak ditemukan."
          : "PIN belum berhasil diganti. Coba lagi.",
    };
  }
  return { status: "success", message: "PIN baru sudah aktif." };
}
