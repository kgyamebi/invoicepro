import Link from "next/link";
import { ContextualHelp } from "@/components/contextual-help";
import { Button, EmptyState, Input, PageHeader, PaymentStatusBadge, statusLabel, statusTone, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/money/currency";
import { d } from "@/lib/money/decimal";
import { formatDate } from "@/lib/date";
import type { DocumentTypeKey } from "@/lib/documents/types";

function hrefWith(basePath: string, current: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) params.set(key, value);
  }
  params.delete("cursor");
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function DocumentList({
  title,
  empty,
  hrefNew,
  basePath,
  currency,
  documents,
  q,
  status,
  sort,
  nextCursor,
}: {
  title: string;
  empty: string;
  hrefNew: string;
  basePath: string;
  currency: string;
  q?: string;
  status?: string;
  sort?: string;
  nextCursor?: string | null;
  documents: {
    id: string;
    number: string;
    status: string;
    issueDate: Date;
    dueDate?: Date | null;
    expiryDate?: Date | null;
    grandTotal: { toString(): string };
    amountPaid?: { toString(): string };
    balanceDue?: { toString(): string };
    customer?: { name: string } | null;
  }[];
}) {
  const current = { q, status, sort };
  const isInvoiceList = title.toLowerCase().includes("invoice");
  const isQuoteList = title.toLowerCase().includes("quotation");
  const singular = title.endsWith("s") ? title.slice(0, -1) : title;
  const now = new Date();

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        description={
          <>
            {isInvoiceList
              ? "Open an invoice to share the PDF or link, then record cash, bank, or mobile money."
              : isQuoteList
                ? "Open a quotation to share, collect acceptance, or convert it to an invoice."
                : `Open a ${singular.toLowerCase()} to share or convert it.`}
            <ContextualHelp title={`${title} tips`}>
              Search and filters run on the server. Press ⌘K for global search.
            </ContextualHelp>
          </>
        }
        actions={<Button href={hrefNew}>New {singular}</Button>}
      />
      <form className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" method="get">
        <Input
          name="q"
          defaultValue={q || ""}
          placeholder={`Search ${title.toLowerCase()}`}
          aria-label={`Search ${title.toLowerCase()}`}
          className="sm:max-w-sm"
        />
        <input type="hidden" name="status" value={status || "all"} />
        <input type="hidden" name="sort" value={sort || "createdAt"} />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      {isInvoiceList || isQuoteList ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label={`Filter ${title.toLowerCase()} by status`}>
          {(isInvoiceList
            ? ([
                ["all", "All"],
                ["unpaid", "Unpaid"],
                ["partial", "Partial"],
                ["paid", "Paid"],
                ["overdue", "Overdue"],
              ] as const)
            : ([
                ["all", "All"],
                ["draft", "Draft"],
                ["sent", "Sent"],
                ["accepted", "Accepted"],
                ["rejected", "Rejected"],
                ["expired", "Expired"],
              ] as const)
          ).map(([key, label]) => (
            <Link
              key={key}
              href={hrefWith(basePath, current, { status: key === "all" ? undefined : key })}
              className={`min-h-11 rounded-full border px-3 py-1.5 text-xs font-medium md:min-h-0 ${
                (status || "all") === key
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-white text-muted hover:text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      ) : null}
      {!documents.length ? (
        <EmptyState
          title={q || status ? "No matches" : empty}
          description={
            q || status
              ? "Try another search or clear the status filter."
              : "Start with a customer and a few line items. Totals are calculated for you."
          }
          icon="list"
          action={<Button href={hrefNew}>Create {singular}</Button>}
        />
      ) : (
        <div className="table-shell">
          <div className="table-sticky hidden grid-cols-[1.25fr_1fr_1fr_auto] gap-4 border-b border-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted md:grid">
            <span>Document</span>
            <span>Customer</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Status</span>
          </div>
          {documents.map((doc) => {
            const overdue =
              isInvoiceList &&
              doc.dueDate &&
              doc.dueDate < now &&
              doc.status !== "paid" &&
              doc.status !== "cancelled" &&
              d(doc.balanceDue?.toString() || 0).gt(0);
            const quoteExpired =
              isQuoteList &&
              doc.expiryDate &&
              doc.expiryDate < now &&
              !["accepted", "rejected", "expired", "cancelled"].includes(doc.status);
            const displayStatus = overdue ? "overdue" : quoteExpired ? "expired" : doc.status;
            return (
              <Link
                key={doc.id}
                href={`${basePath}/${doc.id}`}
                className="grid gap-1 border-b border-line px-5 py-3.5 last:border-b-0 transition hover:bg-bg-elevated/80 md:grid-cols-[1.25fr_1fr_1fr_auto] md:items-center md:gap-4"
              >
                <div>
                  <p className="font-medium tracking-tight">{doc.number}</p>
                  <p className="text-xs text-muted">
                    {formatDate(doc.issueDate)}
                    {isInvoiceList && doc.dueDate ? ` · due ${formatDate(doc.dueDate)}` : ""}
                    {isQuoteList && doc.expiryDate ? ` · expires ${formatDate(doc.expiryDate)}` : ""}
                  </p>
                </div>
                <p className="text-sm text-muted">{doc.customer?.name || "No customer"}</p>
                <div className="text-left md:text-right">
                  <p className="money tabular-nums">{formatMoney(doc.grandTotal.toString(), currency)}</p>
                  {isInvoiceList && doc.balanceDue && displayStatus !== "paid" ? (
                    <p className="text-xs text-muted">Due {formatMoney(doc.balanceDue.toString(), currency)}</p>
                  ) : null}
                </div>
                <div className="md:text-right">
                  {isInvoiceList ? (
                    <PaymentStatusBadge status={displayStatus} />
                  ) : (
                    <Badge tone={statusTone(doc.status)}>{statusLabel(doc.status)}</Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {nextCursor ? (
        <div className="flex justify-end">
          <Link
            href={`${basePath}?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(status ? { status } : {}),
              ...(sort ? { sort } : {}),
              cursor: nextCursor,
            }).toString()}`}
            className="text-sm font-medium text-accent"
          >
            Next page
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function typePath(type: DocumentTypeKey) {
  if (type === "QUOTATION") return "/dashboard/quotations";
  if (type === "RECEIPT") return "/dashboard/receipts";
  return "/dashboard/invoices";
}
