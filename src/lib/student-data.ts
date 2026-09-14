import { prisma } from "@/lib/prisma";

export type AttemptWorkspace = NonNullable<Awaited<ReturnType<typeof getAttemptWorkspace>>>;

export async function getAttemptWorkspace(attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      student: true,
      exam: { include: { questions: { orderBy: { order: "asc" }, include: { testCases: { where: { public: true } } } } } },
      questionAttempts: true
    }
  });

  if (!attempt) return null;

  return {
    attempt: {
      id: attempt.id,
      status: attempt.status,
      deadline: attempt.deadline.toISOString()
    },
    student: {
      id: attempt.student.id,
      prn: attempt.student.prn,
      name: attempt.student.name
    },
    exam: {
      id: attempt.exam.id,
      title: attempt.exam.title
    },
    questions: attempt.exam.questions.map((question) => {
      const qa = attempt.questionAttempts.find((item) => item.questionId === question.id);
      return {
        id: question.id,
        title: question.title,
        description: question.description,
        instructions: question.instructions,
        marks: question.marks,
        language: question.language === "sql" ? "sql" : "python",
        order: question.order,
        code: qa?.code ?? question.starterCode,
        status: qa?.status ?? "UNANSWERED",
        score: qa?.score ?? 0,
        passedTests: qa?.passedTests ?? 0,
        totalTests: qa?.totalTests ?? 0,
        publicTests: question.testCases.map((test) => ({ name: test.name, input: test.input, expectedOutput: test.expectedOutput }))
      };
    })
  };
}

export async function getAttemptResults(attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      student: true,
      exam: { include: { questions: { orderBy: { order: "asc" } } } },
      questionAttempts: true
    }
  });

  if (!attempt) return null;

  return {
    student: attempt.student,
    attempt: {
      status: attempt.status,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      completedAt: attempt.completedAt?.toISOString() ?? null,
      durationUsedSeconds: attempt.completedAt ? Math.round((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000) : null
    },
    totalScore: attempt.totalScore,
    totalMarks: attempt.exam.totalMarks,
    questions: attempt.exam.questions.map((question) => {
      const qa = attempt.questionAttempts.find((item) => item.questionId === question.id);
      return {
        id: question.id,
        title: question.title,
        type: question.type,
        marks: question.marks,
        score: qa?.score ?? 0,
        passedTests: qa?.passedTests ?? 0,
        totalTests: qa?.totalTests ?? 0
      };
    })
  };
}
