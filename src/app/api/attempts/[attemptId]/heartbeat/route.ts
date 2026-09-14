import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";
import { closeExpiredAttempt, isOpenAttemptStatus } from "@/lib/attempt-state";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: { attemptId: string } }) {
  const session = await getStudentSession();
  if (!session || session.attemptId !== params.attemptId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const attempt = await prisma.examAttempt.findUnique({ where: { id: params.attemptId } });
  if (!attempt || !isOpenAttemptStatus(attempt.status)) {
    return NextResponse.json({ ok: false, message: "This examination attempt is closed." }, { status: 409 });
  }

  if (await closeExpiredAttempt(attempt)) {
    return NextResponse.json({ ok: false, expired: true, message: "The examination timer has expired." }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.examAttempt.update({ where: { id: params.attemptId }, data: { lastSeenAt: new Date(), status: "ACTIVE" } }),
    prisma.session.update({ where: { id: session.sessionId }, data: { lastSeenAt: new Date() } })
  ]);

  return NextResponse.json({ ok: true });
}
