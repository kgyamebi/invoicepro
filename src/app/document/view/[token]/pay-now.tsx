"use client";

import { useState } from "react";
import { Banner, Button, Card } from "@/components/ui";
import { formatMoney } from "@/lib/money/currency";

type MethodGroup = {
  provider: string;
  methods: { id: string; label: string; channel: string }[];
};

type SellerPayMethod = {
  label: string;
  provider?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  instructions?: string | null;
};

const PROVIDER_MARK: Record<string, { label: string; hint: string }> = {
  stripe: { label: "Stripe", hint: "Cards · Apple Pay where available" },
  paystack: { label: "Paystack", hint: "Cards · Mobile Money" },
  flutterwave: { label: "Flutterwave", hint: "Cards · Mobile Money" },
};

export function PublicPayNow({
  token,
  invoiceNumber,
  grandTotal,
  amountPaid,
  balanceDue,
  currencyCode,
  dueDate: _dueDate,
  dueLabel,
  status,
  receiptAvailable,
  methodGroups,
  paymentsHeld = false,
  businessName,
  payMethods = [],
  paymentInstructions,
  paymentTerms,
}: {
  token: string;
  invoiceNumber: string;
  grandTotal: string;
  amountPaid: string;
  balanceDue: string;
  currencyCode: string;
  dueDate?: string | null;
  dueLabel?: string;
  status: string;
  receiptAvailable: boolean;
  methodGroups: MethodGroup[];
  paymentsHeld?: boolean;
  businessName: string;
  payMethods?: SellerPayMethod[];
  paymentInstructions?: string | null;
  paymentTerms?: string | null;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  if (["paid", "cancelled"].includes(status)) return null;

  const dueDisplay = dueLabel || "No due date";
  const checkoutOff = paymentsHeld || !methodGroups.length;
  const hasCard = methodGroups.some((group) => group.methods.some((method) => method.channel === "card"));
  const hasMomo = methodGroups.some((group) =>
    group.methods.some((method) => method.channel === "mobile_money" || method.channel === "mpesa"),
  );

  async function pay(provider: string, channel?: string) {
    setError("");
    setPending(`${provider}:${channel || "default"}`);
    try {
      const response = await fetch(`/api/shared/${token}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, channel }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(json.error || "Checkout could not start.");
        return;
      }
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }
      setError("Checkout URL missing from provider response.");
    } catch {
      setError("Could not start checkout. Check your connection and try again.");
    } finally {
      setPending("");
    }
  }

  return (
    <Card className="space-y-5 border-accent/25 bg-gradient-to-br from-accent-soft/60 via-white to-white shadow-[var(--shadow)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {checkoutOff ? "How to pay" : "Secure checkout"}
          </p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{checkoutOff ? "Amount due" : "Pay Now"}</p>
          <p className="mt-1 text-sm text-muted">
            {checkoutOff
              ? `Invoice ${invoiceNumber} · pay ${businessName} directly · receipt when paid in full`
              : `Invoice ${invoiceNumber} · encrypted checkout · receipt issued when paid in full`}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm sm:min-w-[220px]">
          <div className="flex justify-between gap-6">
            <span className="text-muted">Amount due</span>
            <span className="font-semibold tabular-nums">{formatMoney(balanceDue, currencyCode)}</span>
          </div>
          <div className="mt-1 flex justify-between gap-6">
            <span className="text-muted">Amount paid</span>
            <span className="tabular-nums">{formatMoney(amountPaid, currencyCode)}</span>
          </div>
          <div className="mt-1 flex justify-between gap-6">
            <span className="text-muted">Invoice total</span>
            <span className="tabular-nums">{formatMoney(grandTotal, currencyCode)}</span>
          </div>
          <div className="mt-1 flex justify-between gap-6">
            <span className="text-muted">Due date</span>
            <span>{dueDisplay}</span>
          </div>
        </div>
      </div>

      {checkoutOff ? (
        <div className="space-y-3 text-sm">
          {paymentTerms ? <p className="text-muted">Payment terms: {paymentTerms}</p> : null}
          {payMethods.length ? (
            <div className="grid gap-2">
              {payMethods.map((method) => (
                <div key={method.label} className="rounded-2xl border border-line bg-white px-4 py-3">
                  <p className="font-medium">{method.label}</p>
                  {method.bankName ? <p className="mt-1 text-muted">{method.bankName}</p> : null}
                  {method.provider ? <p className="text-muted">{method.provider}</p> : null}
                  {method.accountName ? <p className="tabular-nums">{method.accountName}</p> : null}
                  {method.accountNumber ? <p className="tabular-nums">{method.accountNumber}</p> : null}
                  {method.instructions ? <p className="mt-1 text-muted">{method.instructions}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
          {paymentInstructions ? <p className="text-muted">{paymentInstructions}</p> : null}
          <p className="text-muted">
            {paymentsHeld
              ? `Pay ${businessName} by cash, bank transfer, or mobile money. They will record the payment and issue a receipt when this invoice is paid in full.`
              : "Online checkout is unavailable until the seller configures a payment provider. Use the details on the PDF, or contact the seller."}
          </p>
        </div>
      ) : (
        <>
          {methodGroups.length ? (
            <div className="flex flex-wrap gap-2">
              {methodGroups.map((group) => {
                const mark = PROVIDER_MARK[group.provider] || { label: group.provider, hint: "Secure checkout" };
                return (
                  <span
                    key={group.provider}
                    className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold tracking-wide"
                  >
                    {mark.label}
                  </span>
                );
              })}
              {hasCard ? (
                <>
                  <span className="rounded-full border border-line bg-white px-3 py-1 text-xs">Visa</span>
                  <span className="rounded-full border border-line bg-white px-3 py-1 text-xs">Mastercard</span>
                </>
              ) : null}
              {hasMomo ? (
                <span className="rounded-full border border-line bg-white px-3 py-1 text-xs">Mobile Money</span>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-2 text-xs text-muted sm:grid-cols-3">
            <p>256-bit TLS · PCI handled by the provider</p>
            <p>Webhook-verified settlement · no double capture</p>
            <p>
              {receiptAvailable
                ? "Receipt available after this payment"
                : "A receipt is generated when the invoice is fully paid"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {methodGroups.map((group) => {
              const groupHasCard = group.methods.some((method) => method.channel === "card");
              const groupHasMomo = group.methods.some(
                (method) => method.channel === "mobile_money" || method.channel === "mpesa",
              );
              const mark = PROVIDER_MARK[group.provider] || { label: group.provider, hint: "" };
              return (
                <div key={group.provider} className="flex flex-wrap gap-2">
                  {groupHasCard ? (
                    <Button
                      type="button"
                      className="min-h-12"
                      disabled={Boolean(pending)}
                      onClick={() => pay(group.provider, "card")}
                    >
                      {pending === `${group.provider}:card` ? "Redirecting…" : `Pay with card · ${mark.label}`}
                    </Button>
                  ) : null}
                  {groupHasMomo ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="min-h-12"
                      disabled={Boolean(pending)}
                      onClick={() => pay(group.provider, "mobile_money")}
                    >
                      {pending === `${group.provider}:mobile_money`
                        ? "Redirecting…"
                        : `Mobile Money · ${mark.label}`}
                    </Button>
                  ) : null}
                  {!groupHasCard && !groupHasMomo && group.methods[0] ? (
                    <Button
                      type="button"
                      className="min-h-12"
                      disabled={Boolean(pending)}
                      onClick={() => pay(group.provider, group.methods[0].channel)}
                    >
                      {pending ? "Redirecting…" : `Pay with ${mark.label}`}
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted">
            If you close the provider page, return here and tap Pay again. Completed payments are not charged twice.
          </p>
        </>
      )}
      {error ? <Banner tone="danger">{error}</Banner> : null}
    </Card>
  );
}
