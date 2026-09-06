import { prisma } from "./db";

export async function activateSubscription(input: {
  organizationId: string;
  planKey: string;
  interval: "MONTHLY" | "YEARLY" | "ONE_TIME";
  provider: string;
  providerRef: string;
  creditAmount?: number;
}) {
  if (input.interval === "ONE_TIME" && input.creditAmount) {
    const account = await prisma.creditAccount.upsert({
      where: { organizationId: input.organizationId },
      update: { balance: { increment: input.creditAmount } },
      create: { organizationId: input.organizationId, balance: input.creditAmount },
    });
    await prisma.creditTransaction.create({
      data: {
        creditAccountId: account.id,
        delta: input.creditAmount,
        reason: "credit_pack",
        reference: input.providerRef,
      },
    });
    return { kind: "credits" as const };
  }

  const plan = await prisma.plan.findUnique({ where: { key: input.planKey } });
  if (!plan) {
    throw new Error("Plan not found");
  }
  const now = new Date();
  const end = new Date(now);
  if (input.interval === "YEARLY") end.setUTCFullYear(end.getUTCFullYear() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);

  await prisma.subscription.upsert({
    where: { organizationId: input.organizationId },
    update: {
      planId: plan.id,
      status: "ACTIVE",
      interval: input.interval,
      currentPeriodStart: now,
      currentPeriodEnd: end,
      provider: input.provider,
      providerSubscriptionId: input.providerRef,
    },
    create: {
      organizationId: input.organizationId,
      planId: plan.id,
      status: "ACTIVE",
      interval: input.interval,
      currentPeriodStart: now,
      currentPeriodEnd: end,
      provider: input.provider,
      providerSubscriptionId: input.providerRef,
    },
  });
  return { kind: "subscription" as const, planKey: plan.key };
}

export async function recordProviderTransaction(input: {
  organizationId: string;
  provider: string;
  providerRef: string;
  type: string;
  amount: string;
  currencyCode: string;
  status: string;
  idempotencyKey: string;
  rawPayload?: object;
}) {
  return prisma.paymentTransaction.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    update: { status: input.status, processedAt: new Date() },
    create: {
      ...input,
      processedAt: new Date(),
    },
  });
}
