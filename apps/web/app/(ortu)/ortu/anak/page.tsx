import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { formatLoginCode } from "@coreta/db";

import { ChildDataActions } from "@/components/domain/child-data-actions";
import { PageHeader } from "@/components/domain/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { consentLinkFor, hasCurrentConsent } from "@/lib/auth/consent-server";
import { currentUser } from "@/lib/auth/session-server";
import { createClient } from "@/lib/supabase/server";

import { CreateStudentForm, ResetPinForm, TargetsForm } from "./child-forms";

export const dynamic = "force-dynamic";

const goalLabels: Record<string, string> = {
  tka: "TKA",
  utbk: "UTBK-SNBT",
  both: "TKA dan UTBK-SNBT",
};

export default async function ChildrenPage() {
  const user = await currentUser();
  if (user?.role !== "ortu") redirect("/masuk?next=%2Fortu%2Fanak");

  // Dibaca dengan sesi orang tua: RLS hanya mengembalikan anak yang terhubung dengannya.
  const supabase = await createClient();
  const [children, consented, auth] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, grade, goal, daily_target, login_code, created_at, profiles!students_profile_id_fkey(full_name)",
      )
      .order("created_at"),
    hasCurrentConsent(user.id),
    supabase.auth.getUser(),
  ]);
  if (children.error) throw new Error("Data anak gagal dimuat.");

  const examGoal = auth.data.user?.user_metadata?.exam_goal;
  const defaultGoal = typeof examGoal === "string" && examGoal in goalLabels ? examGoal : "utbk";

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Orang tua"
        title="Profil anak"
        description="Kelola akun siswa, target harian, dan data anak Anda."
        actions={
          <Link href="/ortu/laporan" className={buttonVariants({ variant: "outline" })}>
            Lihat laporan
          </Link>
        }
      />

      {!consented && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="text-sm">
              Akun siswa baru bisa dibuat setelah Anda menyetujui pemrosesan data anak (UU PDP).
            </p>
          </div>
          <Link href={consentLinkFor(user.id)} className={buttonVariants()}>
            Baca dan setujui
          </Link>
        </div>
      )}

      <section aria-labelledby="daftar-anak" className="space-y-4">
        <h2 id="daftar-anak" className="font-heading text-xl font-semibold">
          Anak Anda
        </h2>
        {children.data.length === 0 && (
          <p className="text-muted-foreground">Belum ada akun siswa. Buat akun pertama di bawah.</p>
        )}
        {children.data.map((child) => {
          const name = child.profiles?.full_name ?? "Tanpa nama";
          return (
            <Card key={child.id}>
              <CardHeader>
                <CardTitle className="font-heading text-xl">{name}</CardTitle>
                <CardDescription>
                  {child.grade ? `Kelas ${child.grade}` : "Kelas belum diisi"} · Target{" "}
                  {goalLabels[child.goal] ?? child.goal}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Cara masuk</dt>
                    <dd className="font-semibold">Kode masuk + PIN</dd>
                    <dd className="font-mono text-lg font-bold tracking-widest tabular-nums">
                      {child.login_code ? formatLoginCode(child.login_code) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Target harian</dt>
                    <dd className="font-semibold">{child.daily_target} soal per hari</dd>
                  </div>
                </dl>
                <TargetsForm
                  studentId={child.id}
                  goal={child.goal}
                  dailyTarget={child.daily_target}
                />
                <ResetPinForm studentId={child.id} childName={name} />
                <ChildDataActions childName={name} />
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Buat akun siswa</CardTitle>
          <CardDescription>
            Anak masuk dengan kode masuk dan PIN 6 angka, tanpa email.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-xl">
          <CreateStudentForm defaultGoal={defaultGoal} disabled={!consented} />
        </CardContent>
      </Card>
    </section>
  );
}
