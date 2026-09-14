import type { AttemptStatus, ExamStatus } from "@prisma/client";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { isAttemptOpen } from "@/lib/time";

export const openAttemptStatuses: AttemptStatus[] = ["STARTED", "ACTIVE", "DISCONNECTED"];

type AttemptState = {
  id: string;
  examId: string;
  studentId: string;
  status: AttemptStatus;
  deadline: Date;
};

export function isOpenAttemptStatus(status: AttemptStatus) {
  return openAttemptStatuses.includes(status);
}

export async function completeAttempt(
  attempt: AttemptState,
  status: "COMPLETED" | "FORCE_SUBMITTED" = "COMPLETED",
  now = new Date()
) {
  const result = await prisma.$transaction([
    prisma.examAttempt.updateMany({
      where: { id: attempt.id, status: { in: openAttemptStatuses } },
      data: { status, submittedAt: now, completedAt: now, lastSeenAt: now }
    }),
    prisma.session.updateMany({
      where: { attemptId: attempt.id, status: "ACTIVE" },
      data: { status: status === "COMPLETED" ? "EXPIRED" : "CLOSED", lastSeenAt: now }
    })
  ]);

  if (result[0].count > 0) {
    await audit(status === "FORCE_SUBMITTED" ? "FORCED_SUBMISSION" : "EXAM_COMPLETED", {
      examId: attempt.examId,
      studentId: attempt.studentId,
      attemptId: attempt.id
    });
  }

  return result[0].count > 0;
}

export async function closeExpiredAttempt(attempt: AttemptState, now = new Date()) {
  if (isAttemptOpen(attempt.deadline, now) || !isOpenAttemptStatus(attempt.status)) {
    return false;
  }

  return completeAttempt(attempt, "COMPLETED", now);
}

export async function canAttemptAcceptWork(
  attempt: AttemptState,
  examStatus: ExamStatus,
  now = new Date()
) {
  if (!isOpenAttemptStatus(attempt.status)) {
    return { ok: false as const, message: "This examination attempt is closed." };
  }

  if (examStatus !== "ACTIVE") {
    return { ok: false as const, message: "The examination is not accepting submissions right now." };
  }

  if (!isAttemptOpen(attempt.deadline, now)) {
    await completeAttempt(attempt, "COMPLETED", now);
    return { ok: false as const, message: "The examination timer has expired." };
  }

  return { ok: true as const };
}
