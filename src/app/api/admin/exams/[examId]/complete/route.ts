import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { openAttemptStatuses } from "@/lib/attempt-state";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function POST(_request: Request, { params }: { params: { examId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const now = new Date();
  await prisma.$transaction([
    prisma.exam.update({ where: { id: params.examId }, data: { status: "COMPLETED" } }),
    prisma.examAttempt.updateMany({ where: { examId: params.examId, status: { in: openAttemptStatuses } }, data: { status: "COMPLETED", submittedAt: now, completedAt: now } }),
    prisma.session.updateMany({ where: { attempt: { examId: params.examId }, status: "ACTIVE" }, data: { status: "CLOSED", lastSeenAt: now } })
  ]);
  await audit("EXAM_COMPLETED", { adminId: session.adminId, examId: params.examId });
  return NextResponse.json({ ok: true });
}
