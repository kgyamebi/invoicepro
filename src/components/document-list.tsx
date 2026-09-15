import Link from "next/link";
import { Badge, EmptyState, statusTone } from "@/components/ui";
import { formatMoney } from "@/lib/money/currency";
import { formatDate } from "@/lib/date";
import type { DocumentTypeKey } from "@/lib/documents/types";

export function DocumentList({
  title,
  empty,
  hrefNew,
  basePath,
  currency,
  documents,
}: {
  title: string;
  empty: string;
  hrefNew: string;
  basePath: string;
  currency: string;
  documents: {
    id: string;
    number: string;
    status: string;
    issueDate: Date;
    grandTotal: { toString(): string };
    customer?: { name: string } | null;
  }[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <Link href={hrefNew} className="rounded-lg bg-accent px-4 py-2.5 text-sm text-white">
          New
        </Link>
      </div>
      {!documents.length ? (
        <EmptyState
          title={empty}
          action={
            <Link href={hrefNew} className="rounded-lg bg-accent px-4 py-2.5 text-sm text-white">
              Create {title.slice(0, -1)}
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`${basePath}/${doc.id}`}
              className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0"
            >
              <div>
                <p className="font-medium">{doc.number}</p>
                <p className="text-sm text-muted">{doc.customer?.name || "No customer"} · {formatDate(doc.issueDate)}</p>
              </div>
              <div className="text-right">
                <p>{formatMoney(doc.grandTotal.toString(), currency)}</p>
                <Badge tone={statusTone(doc.status)}>{doc.status.replace("_", " ")}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function typePath(type: DocumentTypeKey) {
  if (type === "QUOTATION") return "/dashboard/quotations";
  if (type === "RECEIPT") return "/dashboard/receipts";
  return "/dashboard/invoices";
}
