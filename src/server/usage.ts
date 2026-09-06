import { AuthError } from "./auth";
import { prisma } from "./db";

function periodBounds(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
}

export async function getOrCreateUsage(organizationId: string) {
  const { start, end } = periodBounds();
  return prisma.usageCounter.upsert({
    where: {
      organizationId_periodStart_periodEnd: {
        organizationId,
        periodStart: start,
        periodEnd: end,
      },
    },
    update: {},
    create: {
      organizationId,
      periodStart: start,
      periodEnd: end,
    },
  });
}

export async function assertCanCreateDocument(organizationId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });
  const plan = subscription?.plan;
  const usage = await getOrCreateUsage(organizationId);
  const credits = await prisma.creditAccount.findUnique({ where: { organizationId } });
  const limit = plan?.documentLimit;
  if (limit !== null && limit !== undefined && usage.documentsCreated >= limit) {
    if (credits && credits.balance > 0) {
      return { usage, usedCredit: true };
    }
    throw new AuthError(
      `You've used ${usage.documentsCreated}/${limit} documents this month.`,
      402,
    );
  }
  return { usage, usedCredit: false };
}

export async function consumeDocumentUsage(organizationId: string, usedCredit: boolean) {
  const usage = await getOrCreateUsage(organizationId);
  await prisma.usageCounter.update({
    where: { id: usage.id },
    data: { documentsCreated: { increment: 1 } },
  });
  if (usedCredit) {
    const account = await prisma.creditAccount.findUnique({ where: { organizationId } });
    if (account) {
      await prisma.creditAccount.update({
        where: { id: account.id },
        data: { balance: { decrement: 1 } },
      });
      await prisma.creditTransaction.create({
        data: {
          creditAccountId: account.id,
          delta: -1,
          reason: "document_created",
        },
      });
    }
  }
}

export async function incrementUsage(
  organizationId: string,
  field: "aiCalls" | "pdfGenerations" | "exports",
) {
  const usage = await getOrCreateUsage(organizationId);
  await prisma.usageCounter.update({
    where: { id: usage.id },
    data: { [field]: { increment: 1 } },
  });
}
