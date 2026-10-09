import { notFound } from "next/navigation";

import { itemToWorkspaceQuestion } from "@/lib/item-preview";
import { getAdminItem } from "@/lib/mock/content";

import { PreviewWorkspace } from "./preview-workspace";

// Shown inside an iframe on the item editor, so the workspace sees the real screen size.
export default async function ItemPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getAdminItem(id);
  if (!item) notFound();

  return (
    <PreviewWorkspace
      question={itemToWorkspaceQuestion(item)}
      worksheetTitle={`Pratinjau ${item.code}`}
      stageName={item.competencyName}
      exitHref={`/admin/konten/butir/${item.id}`}
    />
  );
}
