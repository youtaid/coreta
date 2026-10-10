import "server-only";

import { randomUUID } from "node:crypto";

import {
  derivePinPassword,
  formatLoginCode,
  generateLoginCode,
  normalizeLoginCode,
  studentAuthEmail,
} from "@coreta/db";

import { hasCurrentConsent } from "@/lib/auth/consent-server";
import { roleFromClaims } from "@/lib/auth/roles";
import { CONSENT_VERSION } from "@/lib/consent";
import { getStudentPinPepper } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** 5 PIN salah dalam 15 menit mengunci kode itu 15 menit. */
const CODE_LIMIT = { max: 5, windowSeconds: 15 * 60, lockSeconds: 15 * 60 };
/** Batas kasar per alamat IP agar satu perangkat tidak mencoba banyak kode sekaligus. */
const IP_LIMIT = { max: 30, windowSeconds: 15 * 60, lockSeconds: 15 * 60 };

export type StudentSignInResult =
  { ok: true } | { ok: false; reason: "invalid" | "locked"; lockedUntil?: string };

async function noteFailure(key: string, limit: typeof CODE_LIMIT) {
  const { data } = await createAdminClient().rpc("note_login_failure", {
    throttle_key: key,
    max_failures: limit.max,
    window_seconds: limit.windowSeconds,
    lock_seconds: limit.lockSeconds,
  });
  return data ?? null;
}

async function lockedUntil(key: string) {
  const { data, error } = await createAdminClient().rpc("login_locked_until", {
    throttle_key: key,
  });
  if (error) throw error;
  return data ?? null;
}

/**
 * Masuk siswa dengan kode + PIN. Kode dicari di students (service_role), kata sandi Auth
 * diturunkan dari PIN, lalu sesi dibuat lewat klien cookie biasa. Semua kegagalan memberi jawaban
 * yang sama ("invalid") sehingga kode yang ada tidak bisa ditebak dari pesan galatnya.
 */
export async function signInStudent(input: {
  code: string;
  pin: string;
  ip: string | null;
}): Promise<StudentSignInResult> {
  const code = normalizeLoginCode(input.code);
  const codeKey = `kode:${code ?? input.code.toUpperCase().slice(0, 32)}`;
  const ipKey = input.ip ? `ip:${input.ip}` : null;

  const locks = await Promise.all([lockedUntil(codeKey), ipKey ? lockedUntil(ipKey) : null]);
  const locked = locks.find(Boolean);
  if (locked) return { ok: false, reason: "locked", lockedUntil: locked };

  const fail = async (): Promise<StudentSignInResult> => {
    const [codeLock, ipLock] = await Promise.all([
      noteFailure(codeKey, CODE_LIMIT),
      ipKey ? noteFailure(ipKey, IP_LIMIT) : null,
    ]);
    const until = codeLock ?? ipLock;
    return until
      ? { ok: false, reason: "locked", lockedUntil: until }
      : { ok: false, reason: "invalid" };
  };

  if (!code) return fail();

  const admin = createAdminClient();
  const { data: student, error } = await admin
    .from("students")
    .select("profile_id")
    .eq("login_code", code)
    .maybeSingle();
  if (error) throw error;
  if (!student) return fail();

  const { data: authUser } = await admin.auth.admin.getUserById(student.profile_id);
  const email = authUser.user?.email;
  if (!email) return fail();

  const supabase = await createClient();
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: derivePinPassword(getStudentPinPepper(), student.profile_id, input.pin),
  });
  if (signInError || !data.user) return fail();

  if (roleFromClaims({ app_metadata: data.user.app_metadata }) !== "siswa") {
    await supabase.auth.signOut({ scope: "local" });
    return fail();
  }

  await admin.rpc("clear_login_failures", { throttle_key: codeKey });
  return { ok: true };
}

export type CreateStudentResult =
  | { ok: true; studentId: string; loginCode: string }
  | { ok: false; reason: "no-consent" | "failed" };

/**
 * Akun siswa dibuat orang tua: pengguna Auth (peran siswa, email .invalid, kata sandi dari PIN)
 * lalu register_student (students + guardianships + audit_log, dengan cek persetujuan) dalam satu
 * transaksi. Bila langkah kedua gagal, pengguna Auth dihapus lagi agar tidak ada akun yatim.
 */
export async function createStudentAccount(input: {
  parentId: string;
  fullName: string;
  grade: number;
  goal: "tka" | "utbk" | "both";
  dailyTarget: number;
  pin: string;
}): Promise<CreateStudentResult> {
  // Diperiksa lagi di register_student; di sini agar orang tua mendapat pesan yang tepat dan
  // pengguna Auth tidak dibuat sia-sia.
  if (!(await hasCurrentConsent(input.parentId))) return { ok: false, reason: "no-consent" };

  const admin = createAdminClient();
  const pepper = getStudentPinPepper();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const userId = randomUUID();
    const loginCode = generateLoginCode();

    const created = await admin.auth.admin.createUser({
      id: userId,
      email: studentAuthEmail(userId),
      password: derivePinPassword(pepper, userId, input.pin),
      email_confirm: true,
      app_metadata: { role: "student" },
      user_metadata: { full_name: input.fullName },
    });
    if (created.error) {
      console.error("[anak] pengguna Auth siswa gagal dibuat", created.error.code);
      return { ok: false, reason: "failed" };
    }

    const registered = await admin.rpc("register_student", {
      target_parent: input.parentId,
      student_profile: userId,
      code: loginCode,
      student_grade: input.grade,
      student_goal: input.goal,
      student_daily_target: input.dailyTarget,
      required_consent_version: CONSENT_VERSION,
    });

    if (!registered.error) {
      return { ok: true, studentId: registered.data.id, loginCode: formatLoginCode(loginCode) };
    }

    await admin.auth.admin.deleteUser(userId);
    // 23505 = kode masuk kembar (sangat jarang): coba lagi dengan kode baru.
    if (registered.error.code !== "23505") {
      console.error(
        "[anak] register_student gagal",
        registered.error.code,
        registered.error.message,
      );
      return { ok: false, reason: "failed" };
    }
  }
  return { ok: false, reason: "failed" };
}

/**
 * Orang tua mengganti PIN anaknya. Hubungan wali diperiksa eksplisit di sini karena service_role
 * melewati RLS: orang tua A tidak bisa mengganti PIN anak orang tua B.
 */
export async function resetStudentPin(input: { parentId: string; studentId: string; pin: string }) {
  const admin = createAdminClient();
  const { data: link, error } = await admin
    .from("guardianships")
    .select("students(profile_id, login_code)")
    .eq("parent_id", input.parentId)
    .eq("student_id", input.studentId)
    .maybeSingle();
  if (error) throw error;
  const student = link?.students;
  if (!student) return { ok: false as const, reason: "not-found" as const };

  const updated = await admin.auth.admin.updateUserById(student.profile_id, {
    password: derivePinPassword(getStudentPinPepper(), student.profile_id, input.pin),
  });
  if (updated.error) {
    console.error("[anak] PIN gagal diganti", updated.error.code);
    return { ok: false as const, reason: "failed" as const };
  }

  await Promise.all([
    admin.from("audit_log").insert({
      actor_id: input.parentId,
      action: "student.pin_reset",
      target: `students:${input.studentId}`,
    }),
    student.login_code
      ? admin.rpc("clear_login_failures", { throttle_key: `kode:${student.login_code}` })
      : null,
  ]);
  return { ok: true as const };
}
