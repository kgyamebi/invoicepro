import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { formatMoney } from "@/lib/money/currency";
import { getActiveContext } from "@/server/tenant";
import { prisma } from "@/server/db";

export default async function DashboardPage() {
  const context = await getActiveContext();
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const [invoices, quotations, customers, products] = await Promise.all([
    prisma.document.findMany({
      where: { businessId: context.business.id, type: "INVOICE", deletedAt: null, createdAt: { gte: start } },
    }),
    prisma.document.findMany({
      where: { businessId: context.business.id, type: "QUOTATION", deletedAt: null, createdAt: { gte: start } },
    }),
    prisma.customer.count({ where: { businessId: context.business.id, deletedAt: null } }),
    prisma.product.count({ where: { businessId: context.business.id, deletedAt: null } }),
  ]);
  const currency = context.business.currencyCode;
  const sales = invoices.reduce((sum, item) => sum + Number(item.grandTotal), 0);
  const paid = invoices.reduce((sum, item) => sum + Number(item.amountPaid), 0);
  const outstanding = invoices.reduce((sum, item) => sum + Number(item.balanceDue), 0);
  const overdue = invoices
    .filter((item) => item.dueDate && item.dueDate < new Date() && Number(item.balanceDue) > 0)
    .reduce((sum, item) => sum + Number(item.balanceDue), 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">This month · {context.business.name}</p>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Sales", formatMoney(sales.toFixed(2), currency)],
          ["Paid", formatMoney(paid.toFixed(2), currency)],
          ["Outstanding", formatMoney(outstanding.toFixed(2), currency)],
          ["Overdue", formatMoney(overdue.toFixed(2), currency)],
          ["Quotations", String(quotations.length)],
          ["Accepted", String(quotations.filter((item) => item.status === "accepted").length)],
          ["Customers", String(customers)],
          ["Products", String(products)],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Link href="/dashboard/invoices/new"><Button className="w-full py-4">Create Invoice</Button></Link>
        <Link href="/dashboard/quotations/new"><Button className="w-full py-4" variant="secondary">Create Quotation</Button></Link>
        <Link href="/dashboard/invoices"><Button className="w-full py-4" variant="secondary">Create Receipt</Button></Link>
        <Link href="/dashboard/customers"><Button className="w-full py-4" variant="secondary">Add Customer</Button></Link>
        <Link href="/dashboard/products"><Button className="w-full py-4" variant="secondary">Add Product</Button></Link>
      </div>
    </div>
  );
}
