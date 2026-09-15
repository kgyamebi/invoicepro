import { Button, Card } from "@/components/ui";

export function SetupWizard({
  hasCustomer,
  hasProduct,
  hasQuote,
  hasInvoice,
  hasPaid,
  paymentsHeld = false,
}: {
  hasCustomer: boolean;
  hasProduct: boolean;
  hasQuote: boolean;
  hasInvoice: boolean;
  hasPaid?: boolean;
  paymentsHeld?: boolean;
}) {
  const steps = [
    { done: true, label: "Create business", href: "/dashboard/settings/business" },
    { done: hasCustomer, label: "Add a customer", href: "/dashboard/customers" },
    { done: hasProduct, label: "Add a product", href: "/dashboard/products" },
    { done: hasQuote, label: "Create a quotation", href: "/dashboard/quotations/new" },
    { done: hasInvoice, label: "Create an invoice", href: "/dashboard/invoices/new" },
    { done: Boolean(hasPaid), label: "Get paid", href: "/dashboard/invoices" },
  ];
  if (steps.every((step) => step.done)) {
    return (
      <Card className="border-success/30 bg-success-soft/40">
        <p className="text-sm font-semibold text-success">You’re ready to collect</p>
        <p className="mt-1 text-sm text-muted">
          First invoice paid. Use Reports for aging, and Security for two-factor authentication.
        </p>
      </Card>
    );
  }
  const completed = steps.filter((step) => step.done).length;
  const next = steps.find((step) => !step.done);
  const tips: Record<string, string> = {
    "Add a customer": "A name and email is enough to send your first invoice.",
    "Add a product": "Save a service once — reuse it on every quote.",
    "Create a quotation": "Share a secure link. The customer can accept without an account.",
    "Create an invoice": "Convert an accepted quote or start from a blank invoice.",
    "Get paid": paymentsHeld
      ? "Record cash, bank, or mobile money on the invoice. A receipt is issued when it is paid in full."
      : "Record cash/bank, or share Pay Now when a provider is connected.",
  };
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">First-run setup</p>
          <p className="mt-1 text-sm text-muted">Finish these steps to collect your first payment.</p>
        </div>
        <p className="text-xs font-medium text-muted">
          {completed}/{steps.length}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${Math.round((completed / steps.length) * 100)}%` }}
        />
      </div>
      <ol className="mt-4 space-y-2">
        {steps.map((step, index) => (
          <li
            key={step.label}
            className="flex items-center justify-between gap-3 text-sm"
            aria-current={next?.label === step.label ? "step" : undefined}
          >
            <span className={step.done ? "text-muted line-through" : "font-medium"}>
              {index + 1}. {step.label}
            </span>
            {step.done ? <span className="text-xs text-success">Done</span> : null}
          </li>
        ))}
      </ol>
      {next ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button href={next.href}>Continue: {next.label}</Button>
          <p className="text-xs text-muted">{tips[next.label] || "About 1 minute."}</p>
        </div>
      ) : null}
    </Card>
  );
}
