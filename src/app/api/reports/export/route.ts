import { prisma } from "@/server/db";
import { errorResponse } from "@/server/http";
import { getActiveContext } from "@/server/tenant";
import { incrementUsage } from "@/server/usage";

export async function GET() {
  try {
    const context = await getActiveContext();
    const invoices = await prisma.document.findMany({
      where: { businessId: context.business.id, type: "INVOICE", deletedAt: null },
      include: { customer: true },
    });
    const rows = [
      ["number", "customer", "status", "total", "paid", "balance"].join(","),
      ...invoices.map((item) =>
        [item.number, item.customer?.name || "", item.status, item.grandTotal, item.amountPaid, item.balanceDue].join(","),
      ),
    ].join("\n");
    await incrementUsage(context.organization.id, "exports");
    return new Response(rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=invoices.csv",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
