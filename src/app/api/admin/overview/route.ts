import { AuthError, requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== "SUPER_ADMIN") throw new AuthError("Admin only.", 403);
    const [users, businesses, documents, subscriptions, paidTx, failedTx, ai] = await Promise.all([
      prisma.user.count(),
      prisma.business.count({ where: { deletedAt: null } }),
      prisma.document.count({ where: { deletedAt: null } }),
      prisma.subscription.findMany({ where: { status: "ACTIVE" }, include: { plan: { include: { prices: true } } } }),
      prisma.paymentTransaction.count({ where: { status: "paid" } }),
      prisma.paymentTransaction.count({ where: { status: { in: ["failed", "pending"] } } }),
      prisma.aiRequest.aggregate({ _count: true, _sum: { estimatedCost: true } }),
    ]);
    const mrr = subscriptions.reduce((sum, item) => {
      const monthly = item.plan.prices.find((price) => price.currencyCode === "USD" && price.interval === "MONTHLY");
      return sum + Number(monthly?.amount ?? 0);
    }, 0);
    return json({
      users,
      businesses,
      documents,
      activeSubscriptions: subscriptions.length,
      mrr: mrr.toFixed(2),
      arr: (mrr * 12).toFixed(2),
      paidTransactions: paidTx,
      failedPayments: failedTx,
      aiRequests: ai._count,
      aiCost: (ai._sum.estimatedCost ?? 0).toString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
