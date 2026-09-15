import { prisma } from "./db";

export async function writeAudit(input: {
  organizationId?: string | null;
  businessId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: input.organizationId ?? undefined,
      businessId: input.businessId ?? undefined,
      userId: input.userId ?? undefined,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? undefined,
      metadata: input.metadata as object | undefined,
      ip: input.ip ?? undefined,
    },
  });
}
