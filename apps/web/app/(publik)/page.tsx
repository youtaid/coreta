import { scoringPlaceholder } from "@coreta/scoring";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DEV_ROLE_PARAM, ROLE_HOME, parseDevRole } from "@/lib/navigation";

// Temporary home page; the public landing page is built in Fase 19.
export default async function Home({ searchParams }: PageProps<"/">) {
  // Dev-only role switch (`/?peran=siswa|ortu|admin`) until login exists (Fase 35).
  if (process.env.NODE_ENV === "development") {
    const role = parseDevRole((await searchParams)[DEV_ROLE_PARAM]);
    if (role) redirect(ROLE_HOME[role]);
  }

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-6 py-10"
      data-scoring-status={scoringPlaceholder()}
    >
      <h1 className="font-heading text-4xl font-bold tracking-tight">Coreta</h1>
      <p className="text-lg text-muted-foreground">
        Worksheet matematika TKA/UTBK yang dikerjakan dengan mencoret langsung di layar.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/daftar" />}>
          Daftar
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/harga" />}>
          Lihat harga
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/masuk" />}>
          Masuk
        </Button>
        <Button variant="link" nativeButton={false} render={<Link href="/tema" />}>
          Tema & token desain
        </Button>
      </div>
    </div>
  );
}
