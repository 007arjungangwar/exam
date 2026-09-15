import { notFound, redirect } from "next/navigation";
import { ExamWorkspace } from "@/components/exam-workspace";
import { requireActiveStudentSession } from "@/lib/auth";
import { getAttemptWorkspace } from "@/lib/student-data";

export default async function ExamPage({ params }: { params: { attemptId: string } }) {
  const session = await requireActiveStudentSession(params.attemptId);

  if (!session) {
    redirect("/");
  }

  const workspace = await getAttemptWorkspace(params.attemptId);

  if (!workspace) {
    notFound();
  }

  return <ExamWorkspace workspace={workspace} />;
}
