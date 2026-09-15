import { prisma } from "@/server/db";
import { errorResponse, json } from "@/server/http";
import { getActiveContext } from "@/server/tenant";

export async function GET() {
  try {
    const context = await getActiveContext();
    const invoices = await prisma.document.findMany({
      where: { businessId: context.business.id, type: "INVOICE", deletedAt: null },
      include: { customer: true, items: true },
    });
    const quotations = await prisma.document.findMany({
      where: { businessId: context.business.id, type: "QUOTATION", deletedAt: null },
    });
    const accepted = quotations.filter((item) => item.status === "accepted").length;
    const topCustomers = Object.values(
      invoices.reduce<Record<string, { name: string; total: number }>>((acc, invoice) => {
        const key = invoice.customerId || "unknown";
        acc[key] ??= { name: invoice.customer?.name || "Unknown", total: 0 };
        acc[key].total += Number(invoice.grandTotal);
        return acc;
      }, {}),
    )
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
    const topProducts = Object.values(
      invoices.flatMap((invoice) => invoice.items).reduce<Record<string, { name: string; total: number }>>((acc, item) => {
        acc[item.name] ??= { name: item.name, total: 0 };
        acc[item.name].total += Number(item.lineTotal);
        return acc;
      }, {}),
    )
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
    return json({
      currencyCode: context.business.currencyCode,
      revenue: invoices.reduce((sum, item) => sum + Number(item.grandTotal), 0).toFixed(2),
      paid: invoices.reduce((sum, item) => sum + Number(item.amountPaid), 0).toFixed(2),
      outstanding: invoices.reduce((sum, item) => sum + Number(item.balanceDue), 0).toFixed(2),
      quotations: quotations.length,
      accepted,
      rejected: quotations.filter((item) => item.status === "rejected").length,
      expired: quotations.filter((item) => item.status === "expired").length,
      acceptanceRate: quotations.length ? Math.round((accepted / quotations.length) * 100) : 0,
      topCustomers,
      topProducts,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
