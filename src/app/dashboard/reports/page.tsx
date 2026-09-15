import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/money/currency";
import { prisma } from "@/server/db";
import { getActiveContext } from "@/server/tenant";

export default async function ReportsPage() {
  const context = await getActiveContext();
  const invoices = await prisma.document.findMany({
    where: { businessId: context.business.id, type: "INVOICE", deletedAt: null },
    include: { customer: true, items: true },
  });
  const quotations = await prisma.document.findMany({
    where: { businessId: context.business.id, type: "QUOTATION", deletedAt: null },
  });
  const accepted = quotations.filter((item) => item.status === "accepted").length;
  const currency = context.business.currencyCode;
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-3xl font-semibold">Reports</h1>
        <form action="/api/reports/export">
          <button className="text-sm text-accent" type="submit">Export CSV</button>
        </form>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Card><p className="text-sm text-muted">Revenue</p><p className="text-2xl">{formatMoney(invoices.reduce((s, i) => s + Number(i.grandTotal), 0).toFixed(2), currency)}</p></Card>
        <Card><p className="text-sm text-muted">Outstanding</p><p className="text-2xl">{formatMoney(invoices.reduce((s, i) => s + Number(i.balanceDue), 0).toFixed(2), currency)}</p></Card>
        <Card><p className="text-sm text-muted">Acceptance rate</p><p className="text-2xl">{quotations.length ? Math.round((accepted / quotations.length) * 100) : 0}%</p></Card>
      </div>
    </div>
  );
}
