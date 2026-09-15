import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/money/currency";
import { prisma } from "@/server/db";
import { requireBusinessAccess } from "@/server/tenant";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } } },
  });
  if (!customer) notFound();
  await requireBusinessAccess(customer.businessId);
  const outstanding = customer.documents
    .filter((item) => item.type === "INVOICE")
    .reduce((sum, item) => sum + Number(item.balanceDue), 0);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">{customer.company || customer.name}</h1>
      <Card>
        <p>{customer.email}</p>
        <p>{customer.phone}</p>
        <p className="mt-3 text-sm text-muted">Outstanding {formatMoney(outstanding.toFixed(2), customer.documents[0]?.currencyCode || "USD")}</p>
      </Card>
      <Card>
        {customer.documents.map((doc) => (
          <Link key={doc.id} href={`/dashboard/invoices/${doc.id}`} className="flex justify-between border-b border-line py-2 last:border-0">
            <span>{doc.number}</span>
            <span>{doc.status}</span>
          </Link>
        ))}
      </Card>
    </div>
  );
}
