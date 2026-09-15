import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export type AdminSession = {
  adminId: string;
  email: string;
  role: "ADMIN";
};

export type StudentSession = {
  studentId: string;
  attemptId: string;
  sessionId: string;
  role: "STUDENT";
};

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "development-only-secret-change-me");

export async function createSessionToken(payload: AdminSession | StudentSession) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function readSessionCookie<T>(name: string): Promise<T | null> {
  const token = (await cookies()).get(name)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  return readSessionCookie<AdminSession>("admin_session");
}

export async function getStudentSession() {
  return readSessionCookie<StudentSession>("student_session");
}

export async function requireActiveStudentSession(attemptId: string) {
  const session = await getStudentSession();
  if (!session || session.attemptId !== attemptId) {
    return null;
  }

  const activeSession = await prisma.session.findFirst({
    where: {
      id: session.sessionId,
      attemptId,
      studentId: session.studentId,
      status: "ACTIVE",
      attempt: {
        id: attemptId,
        studentId: session.studentId
      }
    },
    select: { id: true }
  });

  return activeSession ? session : null;
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.SECURE_COOKIES === "true",
    path: "/"
  };
}
