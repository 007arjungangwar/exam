import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { examId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const questions = await prisma.question.findMany({
    where: { examId: params.examId },
    orderBy: { order: "asc" },
    select: { id: true, title: true }
  });
  const attempts = await prisma.examAttempt.findMany({
    where: { examId: params.examId },
    include: { student: true, questionAttempts: { include: { question: true } } }
  });

  const questionHeaders = questions.flatMap((question, index) => [
    `Q${index + 1} ${question.title} Score`,
    `Q${index + 1} Tests Passed`
  ]);
  const header = ["PRN", "Name", "Email", "Section", ...questionHeaders, "Total Score", "Start Time", "Submit Time", "Duration Used", "Status"];
  const rows = attempts.map((attempt) => {
    const questionCells = questions.flatMap((question) => {
      const questionAttempt = attempt.questionAttempts.find((item) => item.questionId === question.id);
      return [String(questionAttempt?.score ?? 0), `${questionAttempt?.passedTests ?? 0}/${questionAttempt?.totalTests ?? 0}`];
    });

    return [
      attempt.student.prn,
      attempt.student.name,
      attempt.student.email,
      attempt.student.section,
      ...questionCells,
      String(attempt.totalScore),
      attempt.startedAt.toISOString(),
      attempt.submittedAt?.toISOString() ?? "",
      attempt.completedAt ? String(Math.round((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000)) : "",
      attempt.status
    ];
  });

  const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="exam-${params.examId}-results.csv"`
    }
  });
}
