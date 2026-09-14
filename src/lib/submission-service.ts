import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { canAttemptAcceptWork } from "@/lib/attempt-state";

export async function autosaveCode(input: { attemptId: string; questionId: string; code: string }) {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: input.attemptId }, include: { exam: true } });

  if (!attempt) {
    return { ok: false, message: "This examination attempt is closed." };
  }

  const open = await canAttemptAcceptWork(attempt, attempt.exam.status);
  if (!open.ok) {
    return open;
  }

  await prisma.questionAttempt.upsert({
    where: { attemptId_questionId: { attemptId: input.attemptId, questionId: input.questionId } },
    update: { code: input.code, lastSavedAt: new Date(), status: "ATTEMPTED" },
    create: { attemptId: input.attemptId, questionId: input.questionId, code: input.code, status: "ATTEMPTED" }
  });

  await audit("CODE_SAVED", { examId: attempt.examId, studentId: attempt.studentId, attemptId: attempt.id, metadata: { questionId: input.questionId } });
  return { ok: true };
}

export async function createSubmission(input: { attemptId: string; questionId: string; code: string; mode: "RUN" | "SUBMIT" }) {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: input.attemptId }, include: { exam: true } });

  if (!attempt) {
    return { ok: false as const, message: "This examination attempt is closed." };
  }

  const open = await canAttemptAcceptWork(attempt, attempt.exam.status);
  if (!open.ok) {
    return { ok: false as const, message: open.message };
  }

  const question = await prisma.question.findUnique({ where: { id: input.questionId } });
  if (!question || question.examId !== attempt.examId) {
    return { ok: false as const, message: "Question is not available for this attempt." };
  }

  const submission = await prisma.submission.create({
    data: {
      attemptId: input.attemptId,
      questionId: input.questionId,
      code: input.code,
      language: question.language,
      mode: input.mode,
      jobs: {
        create: {
          attemptId: input.attemptId,
          runHidden: input.mode === "SUBMIT"
        }
      }
    }
  });

  await prisma.questionAttempt.upsert({
    where: { attemptId_questionId: { attemptId: input.attemptId, questionId: input.questionId } },
    update: { code: input.code, status: input.mode === "SUBMIT" ? "SUBMITTED" : "ATTEMPTED" },
    create: { attemptId: input.attemptId, questionId: input.questionId, code: input.code, status: input.mode === "SUBMIT" ? "SUBMITTED" : "ATTEMPTED" }
  });

  await audit(input.mode === "RUN" ? "CODE_RUN" : "SUBMISSION", { examId: attempt.examId, studentId: attempt.studentId, attemptId: attempt.id, metadata: { questionId: input.questionId, submissionId: submission.id } });

  return { ok: true as const, submissionId: submission.id };
}
