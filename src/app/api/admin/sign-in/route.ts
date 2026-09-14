import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, cookieOptions } from "@/lib/auth";
import { audit } from "@/lib/audit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  const passwordOk = admin ? await bcrypt.compare(parsed.data.password, admin.passwordHash) : false;
  await audit("LOGIN_ATTEMPT", { adminId: admin?.id, metadata: { ok: passwordOk } });

  if (!admin || !passwordOk) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = await createSessionToken({ role: "ADMIN", adminId: admin.id, email: admin.email });
  (await cookies()).set("admin_session", token, cookieOptions());
  return NextResponse.json({ ok: true });
}
