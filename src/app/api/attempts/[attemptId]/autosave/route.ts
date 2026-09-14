import { NextResponse } from "next/server";
import { z } from "zod";
import { getStudentSession } from "@/lib/auth";
import { autosaveCode } from "@/lib/submission-service";

const schema = z.object({
  questionId: z.string().min(1),
  code: z.string().max(200_000)
});

export async function POST(request: Request, { params }: { params: { attemptId: string } }) {
  const session = await getStudentSession();
  if (!session || session.attemptId !== params.attemptId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const result = await autosaveCode({ attemptId: params.attemptId, ...parsed.data });
  return NextResponse.json(result, { status: result.ok ? 200 : 403 });
}
