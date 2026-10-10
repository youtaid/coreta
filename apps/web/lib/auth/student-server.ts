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

/**
 * Setiap percobaan dicatat ("dipesan") SEBELUM PIN diuji, agar permintaan paralel tidak bisa
 * melewati batas: percobaan ke-6 dalam 15 menit mengunci kode itu 15 menit, jadi tersedia 5
 * percobaan. Berhasil masuk menghapus catatan kode itu.
 */
const CODE_LIMIT = { max: 6, windowSeconds: 15 * 60, lockSeconds: 15 * 60 };
/**
 * Batas kasar per alamat IP atas SEMUA percobaan (berhasil atau tidak), agar satu perangkat tidak
 * mencoba banyak kode. Cukup longgar untuk satu kelas yang masuk bersamaan dari jaringan sekolah.
 */
const IP_LIMIT = { max: 120, windowSeconds: 15 * 60, lockSeconds: 15 * 60 };

export type StudentSignInResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "busy" | "no-consent" }
  | { ok: false; reason: "locked"; lockedUntil: string; scope: "code" | "ip" };

async function reserveAttempt(key: string, limit: typeof CODE_LIMIT) {
  const { data, error } = await createAdminClient().rpc("note_login_failure", {
    throttle_key: key,
    max_failures: limit.max,
    window_seconds: limit.windowSeconds,
    lock_seconds: limit.lockSeconds,
  });
  if (error) throw error;
  return data ?? null;
}

async function lockedUntil(key: string) {
  const { data, error } = await createAdminClient().rpc("login_locked_until", {
    throttle_key: key,
  });
  if (error) throw error;
  return data ?? null;
}

/** Ada wali yang menyetujui teks persetujuan versi berlaku untuk siswa ini? */
async function hasGuardianConsent(studentId: string) {
  const admin = createAdminClient();
  const { data: links, error } = await admin
    .from("guardianships")
    .select("parent_id")
    .eq("student_id", studentId);
  if (error) throw error;
  const parents = (links ?? []).map((link) => link.parent_id);
  if (parents.length === 0) return false;
  const { data: consents, error: consentError } = await admin
    .from("consents")
    .select("parent_id")
    .in("parent_id", parents)
    .eq("type", "data_anak")
    .eq("granted", true)
    .eq("version", CONSENT_VERSION)
    .limit(1);
  if (consentError) throw consentError;
  return (consents ?? []).length > 0;
}

/**
 * Masuk siswa dengan kode + PIN. Kode dicari di students (service_role), kata sandi Auth
 * diturunkan dari PIN, lalu sesi dibuat lewat klien cookie biasa. Kode tak dikenal dan PIN salah
 * memberi jawaban yang sama ("invalid") sehingga kode yang ada tidak bisa ditebak. Status
 * persetujuan orang tua hanya diberitahukan kepada yang PIN-nya benar.
 */
export async function signInStudent(input: {
  code: string;
  pin: string;
  ip: string | null;
}): Promise<StudentSignInResult> {
  const code = normalizeLoginCode(input.code);
  const codeKey = `kode:${code ?? input.code.toUpperCase().slice(0, 32)}`;
  const ipKey = input.ip ? `ip:${input.ip}` : null;

  const [codeLocked, ipLocked] = await Promise.all([
    lockedUntil(codeKey),
    ipKey ? lockedUntil(ipKey) : null,
  ]);
  if (codeLocked) return { ok: false, reason: "locked", lockedUntil: codeLocked, scope: "code" };
  if (ipLocked) return { ok: false, reason: "locked", lockedUntil: ipLocked, scope: "ip" };

  const [codeReserved, ipReserved] = await Promise.all([
    reserveAttempt(codeKey, CODE_LIMIT),
    ipKey ? reserveAttempt(ipKey, IP_LIMIT) : null,
  ]);
  if (codeReserved)
    return { ok: false, reason: "locked", lockedUntil: codeReserved, scope: "code" };
  if (ipReserved) return { ok: false, reason: "locked", lockedUntil: ipReserved, scope: "ip" };

  if (!code) return { ok: false, reason: "invalid" };

  const admin = createAdminClient();
  const { data: student, error } = await admin
    .from("students")
    .select("id, profile_id")
    .eq("login_code", code)
    .maybeSingle();
  if (error) throw error;
  if (!student) return { ok: false, reason: "invalid" };

  const { data: authUser } = await admin.auth.admin.getUserById(student.profile_id);
  const email = authUser.user?.email;
  if (!email) return { ok: false, reason: "invalid" };

  const supabase = await createClient();
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: derivePinPassword(getStudentPinPepper(), student.profile_id, input.pin),
  });
  if (signInError || !data.user) {
    // Batas laju atau gangguan Supabase Auth bukan PIN salah: jangan katakan PIN-nya salah.
    const status = signInError?.status ?? 0;
    if (status === 429 || status >= 500) return { ok: false, reason: "busy" };
    return { ok: false, reason: "invalid" };
  }

  if (roleFromClaims({ app_metadata: data.user.app_metadata }) !== "siswa") {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: false, reason: "invalid" };
  }

  await admin.rpc("clear_login_failures", { throttle_key: codeKey });

  // Tanpa persetujuan orang tua (belum ada, ditolak, atau versi lama), akun anak tidak aktif.
  if (!(await hasGuardianConsent(student.id))) {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: false, reason: "no-consent" };
  }
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

    const removed = await admin.auth.admin.deleteUser(userId);
    if (removed.error) {
      // Pengguna Auth tanpa baris students tidak bisa masuk (tidak punya kode), tetapi dicatat
      // agar bisa dibersihkan.
      console.error("[anak] pengguna Auth yatim gagal dihapus", userId, removed.error.code);
    }
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

  // Orang yang tahu PIN lama tidak tetap masuk: semua sesi anak dicabut.
  const revoked = await admin.rpc("revoke_user_sessions", { target_user: student.profile_id });
  if (revoked.error) console.error("[anak] sesi lama gagal dicabut", revoked.error.code);

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
