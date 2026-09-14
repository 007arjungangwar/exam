import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: { studentId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { examId } = await request.json();
  const attempts = await prisma.examAttempt.findMany({ where: { examId, studentId: params.studentId }, select: { id: true } });
  await prisma.session.updateMany({ where: { studentId: params.studentId, attemptId: { in: attempts.map((attempt) => attempt.id) }, status: "ACTIVE" }, data: { status: "CLOSED" } });
  await audit("SESSION_RESET", { adminId: session.adminId, examId, studentId: params.studentId });
  return NextResponse.json({ ok: true });
}
