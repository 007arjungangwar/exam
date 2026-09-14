import type { AuditEventType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function audit(eventType: AuditEventType, data: { examId?: string; studentId?: string; adminId?: string; attemptId?: string; metadata?: Prisma.InputJsonValue }) {
  return prisma.auditLog.create({
    data: {
      eventType,
      examId: data.examId,
      studentId: data.studentId,
      adminId: data.adminId,
      attemptId: data.attemptId,
      metadata: data.metadata
    }
  });
}
