import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { completeAttempt, openAttemptStatuses } from "@/lib/attempt-state";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { studentId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { examId } = await request.json();
  const attempt = await prisma.examAttempt.findFirst({
    where: { examId, studentId: params.studentId, status: { in: openAttemptStatuses } },
    orderBy: { startedAt: "desc" }
  });

  if (!attempt) {
    return NextResponse.json({ ok: false, message: "No active attempt found for this student." }, { status: 404 });
  }

  await completeAttempt(attempt, "FORCE_SUBMITTED");
  await audit("ADMIN_ACTION", {
    adminId: session.adminId,
    examId,
    studentId: params.studentId,
    attemptId: attempt.id,
    metadata: { action: "force_submit" }
  });

  return NextResponse.json({ ok: true, attemptId: attempt.id });
}
