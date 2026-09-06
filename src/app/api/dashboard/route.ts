import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";
import { getActiveContext } from "@/server/tenant";

export async function GET() {
  try {
    const context = await getActiveContext();
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const invoices = await prisma.document.findMany({
      where: {
        businessId: context.business.id,
        type: "INVOICE",
        deletedAt: null,
        createdAt: { gte: start },
      },
    });
    const quotations = await prisma.document.findMany({
      where: {
        businessId: context.business.id,
        type: "QUOTATION",
        deletedAt: null,
        createdAt: { gte: start },
      },
    });
    const [customers, products] = await Promise.all([
      prisma.customer.count({ where: { businessId: context.business.id, deletedAt: null } }),
      prisma.product.count({ where: { businessId: context.business.id, deletedAt: null } }),
    ]);
    const sales = invoices.reduce((sum, item) => sum + Number(item.grandTotal), 0);
    const paid = invoices.reduce((sum, item) => sum + Number(item.amountPaid), 0);
    const outstanding = invoices.reduce((sum, item) => sum + Number(item.balanceDue), 0);
    const overdue = invoices
      .filter((item) => item.status === "overdue" || (item.dueDate && item.dueDate < new Date() && Number(item.balanceDue) > 0))
      .reduce((sum, item) => sum + Number(item.balanceDue), 0);
    return json({
      currencyCode: context.business.currencyCode,
      sales: sales.toFixed(2),
      paid: paid.toFixed(2),
      outstanding: outstanding.toFixed(2),
      overdue: overdue.toFixed(2),
      quotations: quotations.length,
      accepted: quotations.filter((item) => item.status === "accepted").length,
      invoices: invoices.length,
      customers,
      products,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
