import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyExamCode } from "@/lib/exam-code";
import { createSessionToken, cookieOptions } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { closeExpiredAttempt, openAttemptStatuses } from "@/lib/attempt-state";
import { deadlineFrom } from "@/lib/time";
import { genericVerificationError, randomToken, sha256 } from "@/lib/security";

export async function verifyAndStartAttempt(input: { prn: string; email: string; code: string }) {
  const normalizedPrn = input.prn.trim().toUpperCase();
  const normalizedEmail = input.email.trim().toLowerCase();
  const generic = { ok: false as const, message: genericVerificationError() };

  const activeExam = await prisma.exam.findFirst({
    where: { status: "ACTIVE" },
    include: { questions: { orderBy: { order: "asc" } } }
  });

  if (!activeExam?.accessCodeHash) {
    await audit("VERIFY_FAILURE", { metadata: { reason: "no_active_exam" } });
    return generic;
  }

  const student = await prisma.student.findUnique({ where: { prn: normalizedPrn } });
  const codeOk = await verifyExamCode(input.code, activeExam.accessCodeHash);

  if (!student || student.email.toLowerCase() !== normalizedEmail || !student.active || !codeOk) {
    await audit("VERIFY_FAILURE", { examId: activeExam.id, studentId: student?.id, metadata: { reason: "invalid_credentials" } });
    return generic;
  }

  const activation = await prisma.examStudent.findUnique({
    where: { examId_studentId: { examId: activeExam.id, studentId: student.id } }
  });

  if (!activation?.active) {
    await audit("VERIFY_FAILURE", { examId: activeExam.id, studentId: student.id, metadata: { reason: "not_activated" } });
    return generic;
  }

  const now = new Date();
  const existingAttempt = await prisma.examAttempt.findFirst({
    where: { examId: activeExam.id, studentId: student.id, status: { in: openAttemptStatuses } },
    orderBy: { startedAt: "desc" }
  });

  if (existingAttempt) {
    const expired = await closeExpiredAttempt(existingAttempt, now);
    if (expired) {
      return generic;
    }
  }

  const activeSession = await prisma.session.findFirst({
    where: { studentId: student.id, status: "ACTIVE", attempt: { examId: activeExam.id, status: { in: openAttemptStatuses } } }
  });

  if (activeSession) {
    return {
      ok: false as const,
      message: "An active examination session already exists. Please contact the invigilator."
    };
  }

  const attempt = existingAttempt
    ? await prisma.examAttempt.update({
        where: { id: existingAttempt.id },
        data: { status: "ACTIVE", lastSeenAt: now }
      })
    : await prisma.examAttempt.create({
        data: {
          examId: activeExam.id,
          studentId: student.id,
          status: "ACTIVE",
          startedAt: now,
          durationSeconds: activeExam.durationMinutes * 60,
          deadline: deadlineFrom(now, activeExam.durationMinutes),
          questionAttempts: {
            create: activeExam.questions.map((question) => ({
              questionId: question.id,
              code: question.starterCode
            }))
          }
        }
      });

  const headerList = await headers();
  const rawToken = randomToken();
  const session = await prisma.session.create({
    data: {
      studentId: student.id,
      attemptId: attempt.id,
      tokenHash: sha256(rawToken),
      userAgent: headerList.get("user-agent"),
      ipHash: sha256(headerList.get("x-forwarded-for") ?? "local")
    }
  });

  const token = await createSessionToken({ role: "STUDENT", studentId: student.id, attemptId: attempt.id, sessionId: session.id });
  (await cookies()).set("student_session", token, cookieOptions());

  await audit("VERIFY_SUCCESS", { examId: activeExam.id, studentId: student.id, attemptId: attempt.id });
  await audit("EXAM_STARTED", { examId: activeExam.id, studentId: student.id, attemptId: attempt.id });

  return { ok: true as const, attemptId: attempt.id };
}
