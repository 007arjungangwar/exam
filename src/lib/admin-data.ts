import { prisma } from "@/lib/prisma";
import { formatRemaining } from "@/lib/time";

export type DashboardSnapshot = Awaited<ReturnType<typeof getDashboardSnapshot>>;

export async function getDashboardSnapshot() {
  const exam = await prisma.exam.findFirst({ orderBy: { createdAt: "desc" } });
  const students = await prisma.student.findMany({
    orderBy: [{ section: "asc" }, { seatNumber: "asc" }],
    include: {
      activations: { where: { examId: exam?.id ?? "__none__" } },
      attempts: { where: { examId: exam?.id ?? "__none__" }, orderBy: { startedAt: "desc" }, take: 1 }
    }
  });

  const rows = students.map((student) => {
    const activation = student.activations[0];
    const attempt = student.attempts[0];
    const status: string = attempt?.status ?? (activation?.active ? "ACTIVATED" : "NOT_ACTIVATED");

    return {
      id: student.id,
      attemptId: attempt?.id ?? null,
      prn: student.prn,
      name: student.name,
      seatNumber: student.seatNumber,
      status,
      startTime: attempt?.startedAt.toLocaleTimeString(),
      lastActivity: attempt?.lastSeenAt.toLocaleTimeString(),
      remaining: attempt ? formatRemaining(attempt.deadline) : null,
      score: attempt?.totalScore ?? 0
    };
  });

  return {
    exam,
    accessCodeDisplay: exam?.accessCodeHash ? "Generated" : "Not generated",
    metrics: {
      students: students.length,
      activated: rows.filter((row) => row.status !== "NOT_ACTIVATED").length,
      started: rows.filter((row) => ["STARTED", "ACTIVE", "DISCONNECTED", "SUBMITTED", "COMPLETED", "FORCE_SUBMITTED"].includes(row.status)).length,
      submitted: rows.filter((row) => ["SUBMITTED", "COMPLETED", "FORCE_SUBMITTED"].includes(row.status)).length
    },
    students: rows
  };
}
