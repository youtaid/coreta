import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/domain/placeholder-page";

export const metadata: Metadata = {
  title: "Editor Butir — Coreta",
};

export default async function Page({ params }: PageProps<"/admin/konten/butir/[id]">) {
  const { id } = await params;
  return (
    <PlaceholderPage
      eyebrow="Admin"
      title="Editor Butir"
      description={`Butir ${id}.`}
      phase={18}
      links={[{ label: "Daftar butir", href: "/admin/konten" }]}
    />
  );
}
