import { notFound } from "next/navigation";
import { DocumentActions } from "@/components/document-actions";
import { Badge, Card, statusTone } from "@/components/ui";
import { formatDate } from "@/lib/date";
import { formatMoney } from "@/lib/money/currency";
import { prisma } from "@/server/db";
import { requireBusinessAccess } from "@/server/tenant";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: { items: { orderBy: { position: "asc" } }, customer: true, business: true },
  });
  if (!document || document.deletedAt) notFound();
  await requireBusinessAccess(document.businessId);
  const money = (value: { toString(): string }) => formatMoney(value.toString(), document.currencyCode);
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{document.type}</p>
          <h1 className="text-3xl font-semibold">{document.number}</h1>
          <p className="text-muted">{document.customer?.name}</p>
        </div>
        <Badge tone={statusTone(document.status)}>{document.status.replace("_", " ")}</Badge>
      </div>
      <DocumentActions
        id={document.id}
        type={document.type}
        status={document.status}
        customerEmail={document.customer?.email}
      />
      <Card>
        <p className="text-sm text-muted">Issued {formatDate(document.issueDate, document.business.dateFormat)}</p>
        <div className="mt-4 divide-y divide-line">
          {document.items.map((item) => (
            <div key={item.id} className="flex justify-between py-2 text-sm">
              <span>
                {item.quantity.toString()} × {item.name}
              </span>
              <span>{money(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(document.subtotal)}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>{money(document.shippingAmount)}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span>{money(document.grandTotal)}</span></div>
          <div className="flex justify-between"><span>Paid</span><span>{money(document.amountPaid)}</span></div>
          <div className="flex justify-between"><span>Balance</span><span>{money(document.balanceDue)}</span></div>
        </div>
      </Card>
    </div>
  );
}
