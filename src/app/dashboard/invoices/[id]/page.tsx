import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentActions } from "@/components/document-actions";
import { Banner, Badge, Button, Card, MoneyRow, PageHeader, PaymentStatusBadge, statusLabel, statusTone } from "@/components/ui";
import { formatDate } from "@/lib/date";
import { documentDashboardPath, labelForDocumentType } from "@/lib/documents/types";
import { formatMoney } from "@/lib/money/currency";
import { d } from "@/lib/money/decimal";
import { paymentsHeld } from "@/lib/payments/held";
import { prisma } from "@/server/db";
import { getActiveContext } from "@/server/tenant";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getActiveContext();
  const document = await prisma.document.findFirst({
    where: { id, businessId: context.business.id, deletedAt: null },
    include: { items: { orderBy: { position: "asc" } }, customer: true, business: true, payments: { orderBy: { paidAt: "desc" } } },
  });
  if (!document) notFound();
  const money = (value: { toString(): string }) => formatMoney(value.toString(), document.currencyCode);
  const overdue =
    document.type === "INVOICE" &&
    document.dueDate &&
    document.dueDate < new Date() &&
    d(document.balanceDue).gt(0) &&
    document.status !== "paid" &&
    document.status !== "cancelled";
  const quoteExpiring =
    document.type === "QUOTATION" &&
    document.expiryDate &&
    document.expiryDate < new Date(Date.now() + 3 * 864e5) &&
    !["accepted", "rejected", "expired", "cancelled"].includes(document.status);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={labelForDocumentType(document.type)}
        title={document.number}
        description={document.customer?.name || "No customer"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {document.status !== "cancelled" && document.type !== "RECEIPT" ? (
              <Button href={`${documentDashboardPath(document.type, document.id)}/edit`} variant="secondary">
                Edit
              </Button>
            ) : null}
            {document.type === "INVOICE" ? (
              <PaymentStatusBadge status={overdue ? "overdue" : document.status} />
            ) : (
              <Badge tone={statusTone(document.status)}>{statusLabel(document.status)}</Badge>
            )}
          </div>
        }
      />

      {overdue ? (
        <Banner tone="danger">
          Overdue since {formatDate(document.dueDate, document.business.dateFormat)}. Balance due{" "}
          {money(document.balanceDue)}.
        </Banner>
      ) : null}
      {quoteExpiring ? (
        <Banner tone="danger">
          Quotation {document.expiryDate && document.expiryDate < new Date() ? "expired" : "expires soon"} on{" "}
          {formatDate(document.expiryDate, document.business.dateFormat)}.
        </Banner>
      ) : null}

      {document.type === "INVOICE" ? (
        <Card className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Invoice total</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{money(document.grandTotal)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Amount paid</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-success">{money(document.amountPaid)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Amount due</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{money(document.balanceDue)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Due date</p>
            <p className="mt-2 text-2xl font-semibold">
              {document.dueDate ? formatDate(document.dueDate, document.business.dateFormat) : "—"}
            </p>
          </div>
        </Card>
      ) : null}

      <DocumentActions
        id={document.id}
        type={document.type}
        status={document.status}
        customerEmail={document.customer?.email}
        currencyCode={document.currencyCode}
        grandTotal={document.grandTotal.toString()}
        amountPaid={document.amountPaid.toString()}
        balanceDue={document.balanceDue.toString()}
        paymentsHeld={paymentsHeld()}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <p className="text-sm text-muted">
            Issued {formatDate(document.issueDate, document.business.dateFormat)}
            {document.customer ? (
              <>
                {" · "}
                <Link href={`/dashboard/customers/${document.customer.id}`} className="text-accent">
                  {document.customer.name}
                </Link>
              </>
            ) : null}
          </p>
          <div className="mt-4 divide-y divide-line">
            {document.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 py-2.5 text-sm">
                <span>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted">
                    {" "}
                    · {item.quantity.toString()} {item.unit}
                  </span>
                </span>
                <span className="tabular-nums">{money(item.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1">
            <MoneyRow label="Subtotal" value={money(document.subtotal)} />
            <MoneyRow label="Delivery" value={money(document.shippingAmount)} />
            <MoneyRow label="Total" value={money(document.grandTotal)} emphasize />
            {document.type === "INVOICE" ? (
              <>
                <MoneyRow label="Paid" value={money(document.amountPaid)} />
                <MoneyRow label="Balance" value={money(document.balanceDue)} />
              </>
            ) : null}
          </div>
        </Card>

        {document.type === "INVOICE" ? (
          <Card className="p-0">
            <div className="border-b border-line px-5 py-4">
              <p className="font-medium">Payment timeline</p>
            </div>
            {!document.payments.length ? (
              <p className="px-5 py-10 text-sm text-muted">No payments recorded yet.</p>
            ) : (
              document.payments.map((payment) => (
                <Link
                  key={payment.id}
                  href={`/dashboard/payments/${payment.id}`}
                  className="flex items-center justify-between border-b border-line px-5 py-3 last:border-0 hover:bg-bg-elevated"
                >
                  <div>
                    <p className="text-sm font-medium">{payment.method.replace("_", " ")}</p>
                    <p className="text-xs text-muted">{formatDate(payment.paidAt, document.business.dateFormat)}</p>
                  </div>
                  <p className="text-sm tabular-nums">{money(payment.amount)}</p>
                </Link>
              ))
            )}
          </Card>
        ) : (
          <Card>
            <p className="text-sm font-medium">Quotation status</p>
            <p className="mt-2 text-sm text-muted">
              Share the link for acceptance, or convert to an invoice when you are ready to bill. Converted invoices get a due
              date from payment terms (or 14 days).
            </p>
            {document.expiryDate ? (
              <p className="mt-4 text-sm">
                Valid until {formatDate(document.expiryDate, document.business.dateFormat)}
              </p>
            ) : null}
          </Card>
        )}
      </div>
    </div>
  );
}
