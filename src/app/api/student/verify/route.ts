import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { verifyAndStartAttempt } from "@/lib/student-service";
import { genericVerificationError } from "@/lib/security";

const schema = z.object({
  prn: z.string().min(3).max(32),
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/)
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limit = rateLimit(`verify:${ip}`, Number(process.env.VERIFY_RATE_LIMIT ?? 8), 60_000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, message: genericVerificationError() }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: genericVerificationError() }, { status: 400 });
  }

  const result = await verifyAndStartAttempt(parsed.data);
  return NextResponse.json(result, { status: result.ok ? 200 : 403 });
}
