import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubmission } from "@/lib/submission-service";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  questionId: z.string().min(1),
  code: z.string().max(200_000),
  mode: z.enum(["RUN", "SUBMIT"])
});

export async function POST(request: Request, { params }: { params: { attemptId: string } }) {
  const session = await requireActiveStudentSession(params.attemptId);
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const limit = rateLimit(`run:${session.studentId}`, Number(process.env.RUN_CODE_RATE_LIMIT ?? 30), 60_000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, message: "Too many execution requests. Please wait." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const result = await createSubmission({ attemptId: params.attemptId, ...parsed.data });
  return NextResponse.json(result, { status: result.ok ? 200 : 403 });
}

export async function GET(request: Request, { params }: { params: { attemptId: string } }) {
  const session = await requireActiveStudentSession(params.attemptId);
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const submissionId = new URL(request.url).searchParams.get("submissionId");
  if (!submissionId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, attemptId: params.attemptId },
    select: {
      id: true,
      mode: true,
      status: true,
      score: true,
      passedTests: true,
      totalTests: true,
      stdout: true,
      stderr: true,
      executionTime: true,
      submittedAt: true
    }
  });

  if (!submission) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json({ ok: true, submission });
}
