import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: { studentId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { examId } = await request.json();
  await prisma.examStudent.upsert({
    where: { examId_studentId: { examId, studentId: params.studentId } },
    update: { active: true, activatedAt: new Date(), activatedBy: session.adminId },
    create: { examId, studentId: params.studentId, activatedBy: session.adminId }
  });
  await audit("ACTIVATION", { adminId: session.adminId, examId, studentId: params.studentId });
  return NextResponse.json({ ok: true });
}
