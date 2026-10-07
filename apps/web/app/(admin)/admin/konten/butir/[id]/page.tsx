import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ItemEditor } from "@/components/domain/item-editor";
import { ItemPreview } from "@/components/domain/item-preview";
import { PageHeader } from "@/components/domain/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminItem } from "@/lib/mock/content";

export default async function ItemEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getAdminItem(id);
  if (!item) notFound();

  return (
    <section className="space-y-8">
      <Link
        href="/admin/konten"
        className="inline-flex min-h-touch items-center gap-2 rounded-lg text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Daftar butir
      </Link>

      <PageHeader
        eyebrow="Editor butir"
        title={item.code}
        description={`${item.competencyCode} · ${item.competencyName}`}
      />

      <ItemEditor key={item.id} item={item} />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Pratinjau ruang kerja</CardTitle>
          <CardDescription>Lihat butir ini di tiga ukuran layar siswa.</CardDescription>
        </CardHeader>
        <CardContent>
          <ItemPreview previewSrc={`/admin/pratinjau/${item.id}`} />
        </CardContent>
      </Card>
    </section>
  );
}
