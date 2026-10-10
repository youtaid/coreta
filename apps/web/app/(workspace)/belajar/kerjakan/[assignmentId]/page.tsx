import { notFound, redirect } from "next/navigation";

import { getCurrentStudent, getWorkspaceAssignment } from "@/lib/queries/student";

import { WorkspaceScreen } from "./workspace-screen";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: PageProps<"/belajar/kerjakan/[assignmentId]">) {
  const { assignmentId } = await params;
  const student = await getCurrentStudent();
  if (!student) {
    redirect(`/masuk?next=${encodeURIComponent(`/belajar/kerjakan/${assignmentId}`)}`);
  }

  // Dibaca dengan sesi siswa: penugasan orang lain atau yang belum terbit = 404.
  const assignment = await getWorkspaceAssignment(assignmentId);
  if (!assignment || assignment.questions.length === 0) notFound();

  return (
    <WorkspaceScreen
      assignment={{
        id: assignment.id,
        title: assignment.title,
        stageName: assignment.stageName,
        questions: assignment.questions,
      }}
    />
  );
}
