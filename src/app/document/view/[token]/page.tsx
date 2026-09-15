import { notFound } from "next/navigation";
import { Badge, Button, Card, statusTone } from "@/components/ui";
import { formatDate } from "@/lib/date";
import { statusLabel } from "@/lib/documents/status-label";
import { formatMoney } from "@/lib/money/currency";
import { d } from "@/lib/money/decimal";
import { paymentsHeld } from "@/lib/payments/held";
import { detectPaymentMethods } from "@/lib/payments/service";
import { resolveShareToken } from "@/server/documents";
import { prisma } from "@/server/db";
import { AcceptActions } from "./ui";
import { PublicPayNow } from "./pay-now";

const TYPE_LABEL: Record<string, string> = {
  INVOICE: "Invoice",
  QUOTATION: "Quotation",
  RECEIPT: "Receipt",
  ESTIMATE: "Estimate",
};

export default async function SharedDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await resolveShareToken(token);
  if (!record) notFound();
  const document = record.document;
  const payments =
    document.type === "INVOICE"
      ? await prisma.payment.findMany({
          where: { documentId: document.id },
          orderBy: { paidAt: "desc" },
          take: 20,
        })
      : [];
  const money = (value: { toString(): string }) => formatMoney(value.toString(), document.currencyCode);
  const held = paymentsHeld();
  const methodGroups =
    document.type === "INVOICE" && !held
      ? detectPaymentMethods({
          businessCountry: document.business.countryCode,
          currencyCode: document.currencyCode,
        })
      : [];
  const payMethods = (document.business.sellerPayMethods || [])
    .filter((method) => method.isEnabled && method.displayOnDocuments)
    .map((method) => ({
      label: method.label,
      provider: method.provider,
      accountName: method.accountName,
      accountNumber: method.accountNumber,
      bankName: method.bankName,
      instructions: method.instructions,
    }));
  const dateFormat = document.business.dateFormat || "DD/MM/YYYY";

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-10">
      <div>
        <p className="text-sm font-medium text-ink">{document.business.name}</p>
        <p className="mt-1 text-xs text-muted">Secure document · {TYPE_LABEL[document.type] || document.type}</p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {TYPE_LABEL[document.type] || document.type}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{document.number}</h1>
          {document.customer?.name ? <p className="mt-1 text-muted">{document.customer.name}</p> : null}
          <p className="mt-2 text-sm text-muted">
            Issued {formatDate(document.issueDate, dateFormat)}
            {document.dueDate ? ` · Due ${formatDate(document.dueDate, dateFormat)}` : ""}
            {document.expiryDate ? ` · Valid until ${formatDate(document.expiryDate, dateFormat)}` : ""}
          </p>
        </div>
        <Badge tone={statusTone(document.status)}>{statusLabel(document.status)}</Badge>
      </div>
      <Card>
        {document.items.map((item) => (
          <div key={item.id} className="flex justify-between border-b border-line py-2 last:border-0">
            <span>
              {item.quantity.toString()} × {item.name}
            </span>
            <span>{money(item.lineTotal)}</span>
          </div>
        ))}
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{money(document.subtotal)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{money(document.grandTotal)}</span>
          </div>
          {document.type === "INVOICE" ? (
            <>
              <div className="flex justify-between">
                <span>Paid</span>
                <span>{money(document.amountPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span>Balance due</span>
                <span>{money(document.balanceDue)}</span>
              </div>
            </>
          ) : null}
        </div>
      </Card>
      <div className="flex gap-2">
        <Button href={`/api/shared/${token}?download=1`}>Download PDF</Button>
      </div>
      {document.type === "INVOICE" && payments.length ? (
        <Card className="p-0">
          <div className="border-b border-line px-5 py-3">
            <p className="font-medium">Payment history</p>
          </div>
          {payments.map((payment) => (
            <div key={payment.id} className="flex justify-between border-b border-line px-5 py-2 last:border-0">
              <span className="text-sm">{payment.method.replace("_", " ")}</span>
              <span className="text-sm tabular-nums">{money(payment.amount)}</span>
            </div>
          ))}
        </Card>
      ) : null}
      {document.type === "QUOTATION" && !["accepted", "rejected", "expired"].includes(document.status) ? (
        <AcceptActions token={token} />
      ) : null}
      {document.type === "INVOICE" ? (
        <PublicPayNow
          token={token}
          invoiceNumber={document.number}
          grandTotal={document.grandTotal.toString()}
          amountPaid={document.amountPaid.toString()}
          balanceDue={document.balanceDue.toString()}
          currencyCode={document.currencyCode}
          dueDate={document.dueDate?.toISOString() || null}
          dueLabel={document.dueDate ? formatDate(document.dueDate, dateFormat) : "No due date"}
          status={document.status}
          receiptAvailable={document.status === "paid" || !d(document.balanceDue).gt(0)}
          methodGroups={methodGroups}
          paymentsHeld={held}
          businessName={document.business.name}
          payMethods={payMethods}
          paymentInstructions={document.business.paymentInstructions}
          paymentTerms={document.paymentTerms}
        />
      ) : null}
      <p className="text-xs text-muted">
        This link is issued by {document.business.name}. Quotation acceptance records a timestamp and status; it is not a
        legally binding electronic signature.
      </p>
    </div>
  );
}
