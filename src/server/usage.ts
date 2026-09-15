import type { DocumentType, Plan, Subscription } from "@prisma/client";
import { parsePlanFeatures } from "@/lib/billing/plans";
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

function isUsableSubscription(subscription: (Subscription & { plan: Plan }) | null) {
  if (!subscription) return false;
  if (subscription.status === "CANCELLED" || subscription.status === "INCOMPLETE") {
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd > new Date()) {
      return true;
    }
    return false;
  }
  return subscription.status === "ACTIVE" || subscription.status === "TRIALING" || subscription.status === "PAST_DUE";
}

export async function resolveActivePlan(organizationId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });
  if (isUsableSubscription(subscription) && subscription) {
    return { subscription, plan: subscription.plan };
  }
  const free = await prisma.plan.findUnique({ where: { key: "free" } });
  return { subscription, plan: free };
}

async function countDocumentsThisMonth(organizationId: string, types: DocumentType[]) {
  const { start, end } = periodBounds();
  return prisma.document.count({
    where: {
      deletedAt: null,
      type: { in: types },
      createdAt: { gte: start, lt: end },
      business: { organizationId },
    },
  });
}

export async function countCustomers(organizationId: string) {
  return prisma.customer.count({
    where: { deletedAt: null, business: { organizationId } },
  });
}

export async function getPlanUsageSnapshot(organizationId: string) {
  const { plan, subscription } = await resolveActivePlan(organizationId);
  const features = parsePlanFeatures(plan?.features);
  const [invoices, quotations, customers, usage] = await Promise.all([
    countDocumentsThisMonth(organizationId, ["INVOICE", "PROFORMA"]),
    countDocumentsThisMonth(organizationId, ["QUOTATION", "ESTIMATE"]),
    countCustomers(organizationId),
    getOrCreateUsage(organizationId),
  ]);
  return {
    plan,
    subscription,
    features,
    invoices,
    quotations,
    customers,
    usage,
  };
}

export async function assertCanCreateDocument(organizationId: string, type?: DocumentType) {
  const { plan } = await resolveActivePlan(organizationId);
  const usage = await getOrCreateUsage(organizationId);
  const credits = await prisma.creditAccount.findUnique({ where: { organizationId } });
  const features = parsePlanFeatures(plan?.features);
  const fairUse = plan && "fairUseCap" in plan ? Number(plan.fairUseCap ?? 0) : 0;
  if (fairUse > 0 && usage.documentsCreated >= fairUse) {
    throw new AuthError("This workspace has reached its fair-use document cap.", 402);
  }

  if (type === "INVOICE" || type === "PROFORMA") {
    if (features.invoiceLimit !== null) {
      const used = await countDocumentsThisMonth(organizationId, ["INVOICE", "PROFORMA"]);
      if (used >= features.invoiceLimit) {
        throw new AuthError(
          `You've used ${used}/${features.invoiceLimit} invoices this month. Upgrade to Solo for unlimited invoicing from $2/month.`,
          402,
        );
      }
      return { usage, usedCredit: false };
    }
  }

  if (type === "QUOTATION" || type === "ESTIMATE") {
    if (features.quotationLimit !== null) {
      const used = await countDocumentsThisMonth(organizationId, ["QUOTATION", "ESTIMATE"]);
      if (used >= features.quotationLimit) {
        throw new AuthError(
          `You've used ${used}/${features.quotationLimit} quotations this month. Upgrade to Solo for unlimited quotations from $2/month.`,
          402,
        );
      }
      return { usage, usedCredit: false };
    }
  }

  const limit = plan?.documentLimit;
  if (limit !== null && limit !== undefined && usage.documentsCreated >= limit) {
    if (credits && credits.balance > 0) {
      return { usage, usedCredit: true };
    }
    throw new AuthError(
      `You've used ${usage.documentsCreated}/${limit} documents this month. Upgrade for unlimited usage.`,
      402,
    );
  }
  return { usage, usedCredit: false };
}

export async function assertCanAddCustomer(organizationId: string) {
  const { plan } = await resolveActivePlan(organizationId);
  const features = parsePlanFeatures(plan?.features);
  if (features.customerLimit === null) return;
  const used = await countCustomers(organizationId);
  if (used >= features.customerLimit) {
    throw new AuthError(
      `Free plan includes ${features.customerLimit} customers. Upgrade to Solo for unlimited customers.`,
      402,
    );
  }
}

export async function assertCanUseCustomLogo(organizationId: string) {
  const { plan } = await resolveActivePlan(organizationId);
  const features = parsePlanFeatures(plan?.features);
  if (!features.customLogo) {
    throw new AuthError("Custom logos are available on the Business plan.", 402);
  }
}

export async function assertCanUseAdvancedReports(organizationId: string) {
  const { plan } = await resolveActivePlan(organizationId);
  const features = parsePlanFeatures(plan?.features);
  if (features.reports !== "advanced") {
    throw new AuthError("CSV export and advanced reports are available on the Business plan.", 402);
  }
}

export async function assertCanUseTeams(organizationId: string) {
  const { plan } = await resolveActivePlan(organizationId);
  const features = parsePlanFeatures(plan?.features);
  if (!features.teams) {
    throw new AuthError("Team access is available on the Business plan.", 402);
  }
}

export async function resolvePdfPresentation(organizationId: string, logoPath?: string | null) {
  const { plan } = await resolveActivePlan(organizationId);
  const features = parsePlanFeatures(plan?.features);
  return {
    logoPath: features.customLogo ? logoPath ?? null : null,
    platformBrand: features.invoiceflowBranding
      ? "Created with InvoiceFlow — Professional invoicing for every small business"
      : null,
  };
}

export async function assertCanGeneratePdf(organizationId: string) {
  const { plan } = await resolveActivePlan(organizationId);
  const usage = await getOrCreateUsage(organizationId);
  const limit = plan?.pdfLimit;
  if (limit !== null && limit !== undefined && usage.pdfGenerations >= limit) {
    throw new AuthError(`You've used ${usage.pdfGenerations}/${limit} PDF downloads this month.`, 402);
  }
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

export async function assertCanUseAi(organizationId: string) {
  const { plan } = await resolveActivePlan(organizationId);
  const usage = await getOrCreateUsage(organizationId);
  const limit = plan?.aiLimit ?? 0;
  if (limit <= 0) {
    throw new AuthError("AI is not included on your current plan.", 402);
  }
  if (usage.aiCalls >= limit) {
    throw new AuthError(`You've used ${usage.aiCalls}/${limit} AI requests this month.`, 402);
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
