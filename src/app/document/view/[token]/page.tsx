import { notFound } from "next/navigation";
import { Badge, Button, Card, statusTone } from "@/components/ui";
import { formatMoney } from "@/lib/money/currency";
import { resolveShareToken } from "@/server/documents";
import { AcceptActions } from "./ui";

export default async function SharedDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const record = await resolveShareToken(token);
  if (!record) notFound();
  const document = record.document;
  const money = (value: { toString(): string }) => formatMoney(value.toString(), document.currencyCode);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
      <p className="text-sm text-muted">{document.business.name}</p>
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-semibold">{document.number}</h1>
        <Badge tone={statusTone(document.status)}>{document.status}</Badge>
      </div>
      <Card>
        {document.items.map((item) => (
          <div key={item.id} className="flex justify-between border-b border-line py-2 last:border-0">
            <span>{item.quantity.toString()} × {item.name}</span>
            <span>{money(item.lineTotal)}</span>
          </div>
        ))}
        <div className="mt-4 flex justify-between font-semibold">
          <span>Total</span>
          <span>{money(document.grandTotal)}</span>
        </div>
      </Card>
      <div className="flex gap-2">
        <a href={`/api/shared/${token}?download=1`}>
          <Button>Download PDF</Button>
        </a>
      </div>
      {document.type === "QUOTATION" && !["accepted", "rejected", "expired"].includes(document.status) ? (
        <AcceptActions token={token} />
      ) : null}
      <p className="text-xs text-muted">Acceptance records a timestamp and status. It is not a legally binding electronic signature.</p>
    </div>
  );
}
