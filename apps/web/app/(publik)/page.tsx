import { scoringPlaceholder } from "@coreta/scoring";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

// Temporary home page; the public landing page is built in Fase 19.
export default function Home() {
  return (
    <main
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-6 px-6 py-16"
      data-scoring-status={scoringPlaceholder()}
    >
      <ThemeToggle />
      <h1 className="font-heading text-4xl font-bold tracking-tight">Coreta</h1>
      <p className="text-lg text-muted-foreground">
        Worksheet matematika TKA/UTBK yang dikerjakan dengan mencoret langsung di layar.
      </p>
      <Link
        href="/tema"
        className="inline-flex h-touch items-center rounded-lg bg-primary px-5 font-medium text-primary-foreground"
      >
        Lihat tema & token desain
      </Link>
    </main>
  );
}
