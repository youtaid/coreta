import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { StudentLoginForm } from "./student-login-form";

export default async function StudentLoginPage({ searchParams }: PageProps<"/masuk/siswa">) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-8 sm:py-16">
      <Card className="border-border/80 shadow-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="font-heading text-2xl font-bold">Masuk sebagai Siswa</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Masukkan kode masuk dan PIN yang dibuat orang tua Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentLoginForm next={Array.isArray(next) ? next[0] : next} />
        </CardContent>
        <CardFooter className="justify-center border-t border-border/60 bg-muted/20 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Orang tua atau wali?{" "}
            <Link href="/masuk" className="font-semibold text-primary underline underline-offset-4">
              Masuk dengan email
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
