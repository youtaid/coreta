import { Target } from "lucide-react";
import Link from "next/link";

import { ChildDataActions } from "@/components/domain/child-data-actions";
import { CreateStudentForm } from "@/components/domain/create-student-form";
import { PageHeader } from "@/components/domain/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { children } from "@/lib/mock/report";

const loginMethodLabel = { email: "Email", code: "Kode masuk + PIN" } as const;

export default function ChildrenPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Orang tua"
        title="Profil anak"
        description="Kelola akun siswa, target harian, dan data anak Anda."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href="/ortu/laporan" />}>
            Lihat laporan
          </Button>
        }
      />

      <section aria-labelledby="daftar-anak" className="space-y-4">
        <h2 id="daftar-anak" className="font-heading text-xl font-semibold">
          Anak Anda
        </h2>
        {children.map((child) => (
          <Card key={child.id}>
            <CardHeader>
              <CardTitle className="font-heading text-xl">{child.name}</CardTitle>
              <CardDescription>
                {child.grade} · {child.currentStage}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <dl className="grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-muted-foreground">Cara masuk</dt>
                  <dd className="font-semibold">{loginMethodLabel[child.loginMethod]}</dd>
                  <dd className="text-muted-foreground tabular-nums">{child.loginLabel}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Target harian</dt>
                  <dd>
                    <Badge variant="secondary">
                      <Target aria-hidden />
                      {child.dailyGoal} soal per hari
                    </Badge>
                  </dd>
                </div>
              </dl>
              <ChildDataActions childName={child.name} />
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Buat akun siswa</CardTitle>
          <CardDescription>
            Tambahkan anak lain atau buat akun baru untuk anak Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-xl">
          <CreateStudentForm />
        </CardContent>
      </Card>
    </section>
  );
}
