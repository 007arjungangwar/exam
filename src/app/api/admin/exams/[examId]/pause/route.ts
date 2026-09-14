import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function POST(_request: Request, { params }: { params: { examId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  await prisma.exam.update({ where: { id: params.examId }, data: { status: "PAUSED" } });
  await audit("EXAM_PAUSED", { adminId: session.adminId, examId: params.examId });
  return NextResponse.json({ ok: true });
}
