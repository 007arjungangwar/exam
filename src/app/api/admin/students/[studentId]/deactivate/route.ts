import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: { studentId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { examId } = await request.json();
  const started = await prisma.examAttempt.findFirst({ where: { examId, studentId: params.studentId } });
  if (started) return NextResponse.json({ ok: false, message: "Cannot deactivate after start. Reset session instead." }, { status: 409 });
  await prisma.examStudent.update({ where: { examId_studentId: { examId, studentId: params.studentId } }, data: { active: false } });
  await audit("DEACTIVATION", { adminId: session.adminId, examId, studentId: params.studentId });
  return NextResponse.json({ ok: true });
}
