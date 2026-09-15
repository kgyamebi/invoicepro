import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";
import { getActiveContext } from "@/server/tenant";

export async function GET() {
  try {
    const context = await getActiveContext();
    const payments = await prisma.payment.findMany({
      where: { businessId: context.business.id },
      include: { document: true },
      orderBy: { paidAt: "desc" },
      take: 100,
    });
    return json({
      payments: payments.map((item) => ({
        ...item,
        amount: item.amount.toString(),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
