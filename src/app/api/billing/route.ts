import { detectPaymentMethods } from "@/lib/payments/service";
import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";
import { getOrCreateUsage } from "@/server/usage";
import { requireUser } from "@/server/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const membership = user.memberships[0];
    if (!membership) return json({ error: "Workspace missing." }, 409);
    const [plans, subscription, credits, usage] = await Promise.all([
      prisma.plan.findMany({
        where: { isActive: true },
        include: { prices: { where: { isActive: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.subscription.findUnique({
        where: { organizationId: membership.organizationId },
        include: { plan: true },
      }),
      prisma.creditAccount.findUnique({ where: { organizationId: membership.organizationId } }),
      getOrCreateUsage(membership.organizationId),
    ]);
    const country = user.countryCode || membership.organization.businesses[0]?.countryCode || "US";
    const currency = membership.organization.businesses[0]?.currencyCode || "USD";
    return json({
      plans,
      subscription,
      credits: credits?.balance ?? 0,
      usage,
      methods: detectPaymentMethods({
        userCountry: user.countryCode,
        businessCountry: country,
        currencyCode: currency,
      }),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
