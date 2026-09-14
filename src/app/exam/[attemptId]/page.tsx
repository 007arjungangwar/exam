import { notFound, redirect } from "next/navigation";
import { ExamWorkspace } from "@/components/exam-workspace";
import { getStudentSession } from "@/lib/auth";
import { getAttemptWorkspace } from "@/lib/student-data";

export default async function ExamPage({ params }: { params: { attemptId: string } }) {
  const session = await getStudentSession();

  if (!session || session.attemptId !== params.attemptId) {
    redirect("/");
  }

  const workspace = await getAttemptWorkspace(params.attemptId);

  if (!workspace) {
    notFound();
  }

  return <ExamWorkspace workspace={workspace} />;
}
