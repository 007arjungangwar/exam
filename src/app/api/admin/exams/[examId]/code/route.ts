import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { generateSixDigitCode, hashExamCode } from "@/lib/exam-code";

export async function POST(_request: Request, { params }: { params: { examId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const code = generateSixDigitCode();
  await prisma.exam.update({
    where: { id: params.examId },
    data: { accessCodeHash: await hashExamCode(code), codeGeneratedAt: new Date() }
  });
  await audit("ADMIN_ACTION", { adminId: session.adminId, examId: params.examId, metadata: { action: "regenerate_code" } });

  return NextResponse.json({ ok: true, code });
}
