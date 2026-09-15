"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banner, Button, Card, Field, Input, MoneyRow, Select } from "@/components/ui";
import { documentDashboardPath } from "@/lib/documents/types";
import { formatMoney } from "@/lib/money/currency";
import { d } from "@/lib/money/decimal";

const NETWORK = "Could not reach InvoiceFlow. Check your connection and try again.";

async function readJson(response: Response) {
  return (await response.json().catch(() => ({}))) as {
    error?: string;
    viewUrl?: string;
    whatsappUrl?: string;
    document?: { id?: string; type?: string };
  };
}

export function DocumentActions({
  id,
  type,
  status,
  customerEmail,
  currencyCode,
  grandTotal,
  amountPaid,
  balanceDue,
  paymentsHeld = false,
}: {
  id: string;
  type: string;
  status: string;
  customerEmail?: string | null;
  currencyCode?: string;
  grandTotal?: string;
  amountPaid?: string;
  balanceDue?: string;
  paymentsHeld?: boolean;
}) {
  const router = useRouter();
  const [share, setShare] = useState<{ viewUrl: string; whatsappUrl: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("MOBILE_MONEY");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const currency = currencyCode || "USD";
  const remainingAfter = (() => {
    try {
      return amount ? d(balanceDue || 0).minus(amount || 0) : null;
    } catch {
      return null;
    }
  })();

  async function shareDoc(channel?: string) {
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch(`/api/documents/${id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      const json = await readJson(response);
      if (!response.ok) {
        setMessage(json.error || "Could not create a share link.");
        return;
      }
      if (!json.viewUrl) {
        setMessage("Share link missing from the server response.");
        return;
      }
      setShare({ viewUrl: json.viewUrl, whatsappUrl: json.whatsappUrl || "" });
      if (channel === "whatsapp") {
        if (json.whatsappUrl) window.open(json.whatsappUrl, "_blank");
        else setMessage("Share link created. WhatsApp could not be opened.");
        return;
      }
      if (channel === "copy" || !channel) {
        try {
          await navigator.clipboard.writeText(json.viewUrl);
          setMessage("Link copied. Share it with your customer.");
        } catch {
          setMessage("Share link created.");
        }
      }
    } catch {
      setMessage(NETWORK);
    } finally {
      setBusy(false);
    }
  }

  async function convertQuote() {
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch(`/api/quotations/${id}/convert-to-invoice`, { method: "POST" });
      const json = await readJson(response);
      if (!response.ok || !json.document?.id) {
        setMessage(json.error || "Could not convert this quotation.");
        return;
      }
      router.push(documentDashboardPath("INVOICE", json.document.id));
    } catch {
      setMessage(NETWORK);
    } finally {
      setBusy(false);
    }
  }

  async function recordPay() {
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch(`/api/invoices/${id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method }),
      });
      const json = await readJson(response);
      if (!response.ok) {
        setMessage(json.error || "Could not record payment.");
        return;
      }
      setAmount("");
      router.refresh();
    } catch {
      setMessage(NETWORK);
    } finally {
      setBusy(false);
    }
  }

  async function makeReceipt() {
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch(`/api/invoices/${id}/convert-to-receipt`, { method: "POST" });
      const json = await readJson(response);
      if (!response.ok || !json.document?.id) {
        setMessage(json.error || "Could not create a receipt.");
        return;
      }
      router.push(documentDashboardPath("RECEIPT", json.document.id));
    } catch {
      setMessage(NETWORK);
    } finally {
      setBusy(false);
    }
  }

  async function duplicate() {
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch(`/api/documents/${id}/duplicate`, { method: "POST" });
      const json = await readJson(response);
      if (!response.ok || !json.document?.id) {
        setMessage(json.error || "Could not duplicate this document.");
        return;
      }
      router.push(documentDashboardPath(json.document.type || type, json.document.id));
    } catch {
      setMessage(NETWORK);
    } finally {
      setBusy(false);
    }
  }

  async function remind() {
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", documentId: id }),
      });
      const json = await readJson(response);
      if (!response.ok) {
        setMessage(json.error || "Could not send a reminder.");
        return;
      }
      setMessage("Reminder queued.");
    } catch {
      setMessage(NETWORK);
    } finally {
      setBusy(false);
    }
  }

  async function repeatMonthly() {
    setMessage("");
    setBusy(true);
    try {
      const next = new Date();
      next.setMonth(next.getMonth() + 1);
      const response = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceDocumentId: id,
          frequency: "MONTHLY",
          nextRunAt: next.toISOString().slice(0, 10),
        }),
      });
      const json = await readJson(response);
      if (!response.ok) {
        setMessage(json.error || "Could not schedule a recurring invoice.");
        return;
      }
      router.push("/dashboard/recurring");
    } catch {
      setMessage(NETWORK);
    } finally {
      setBusy(false);
    }
  }

  async function revokeLinks() {
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch(`/api/documents/${id}/share/revoke`, { method: "POST" });
      const json = await readJson(response);
      if (!response.ok) {
        setMessage(json.error || "Could not revoke share links.");
        return;
      }
      setShare(null);
      setMessage("Share links revoked.");
    } catch {
      setMessage(NETWORK);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {type === "QUOTATION" ? (
          <Button type="button" onClick={convertQuote} disabled={busy}>
            Convert to invoice
          </Button>
        ) : null}
        <Button type="button" onClick={() => shareDoc("copy")} disabled={busy}>
          Copy link
        </Button>
        <Button type="button" variant="secondary" onClick={() => shareDoc("whatsapp")} disabled={busy}>
          WhatsApp
        </Button>
        <Button href={`/api/documents/${id}/pdf`} target="_blank" variant="secondary">
          PDF
        </Button>
        {customerEmail ? (
          <Button type="button" variant="secondary" onClick={() => shareDoc("email")} disabled={busy}>
            Email
          </Button>
        ) : null}
        {type === "INVOICE" && d(amountPaid || 0).gt(0) ? (
          <Button type="button" variant="secondary" onClick={makeReceipt} disabled={busy}>
            Receipt
          </Button>
        ) : null}
        <div className="relative">
          <Button type="button" variant="ghost" onClick={() => setMoreOpen((open) => !open)} aria-expanded={moreOpen}>
            More
          </Button>
          {moreOpen ? (
            <div className="absolute right-0 z-20 mt-1 min-w-48 rounded-[10px] border border-line bg-white p-1 shadow-[var(--shadow)]">
              <button
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-bg-elevated"
                onClick={() => {
                  setMoreOpen(false);
                  void duplicate();
                }}
              >
                Duplicate
              </button>
              {type === "INVOICE" ? (
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-bg-elevated"
                  onClick={() => {
                    setMoreOpen(false);
                    void repeatMonthly();
                  }}
                >
                  Repeat monthly
                </button>
              ) : null}
              {type === "INVOICE" && status !== "draft" && status !== "paid" && status !== "cancelled" ? (
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-bg-elevated disabled:opacity-50"
                  disabled={!customerEmail}
                  onClick={() => {
                    setMoreOpen(false);
                    void remind();
                  }}
                >
                  Send reminder
                </button>
              ) : null}
              <button
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft"
                onClick={async () => {
                  setMoreOpen(false);
                  if (!window.confirm("Revoke all active share links for this document?")) return;
                  await revokeLinks();
                }}
              >
                Revoke links
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {type !== "QUOTATION" && !customerEmail ? (
        <p className="text-xs text-muted">No customer email on file — copy the link or share on WhatsApp.</p>
      ) : null}
      {type === "INVOICE" && status !== "paid" && status !== "cancelled" ? (
        <div className="grid gap-4 rounded-2xl border border-line bg-bg-elevated p-4 md:grid-cols-[1fr_1.2fr]">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Record payment</p>
            <p className="text-xs text-muted">
              {paymentsHeld
                ? "Cash, bank transfer, or mobile money. A receipt is issued when this invoice is paid in full."
                : "Record what you received. Online Pay Now is separate."}
            </p>
            <MoneyRow label="Invoice total" value={formatMoney(grandTotal || "0", currency)} />
            <MoneyRow label="Already paid" value={formatMoney(amountPaid || "0", currency)} />
            <MoneyRow label="Remaining" value={formatMoney(balanceDue || "0", currency)} emphasize />
            {remainingAfter && !remainingAfter.isNegative() ? (
              <p className="text-xs text-muted">
                After this payment: {formatMoney(remainingAfter.toFixed(2), currency)} remaining
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Amount" hint="Must be greater than zero">
              <Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" inputMode="decimal" />
            </Field>
            <Field label="Method">
              <Select value={method} onChange={(event) => setMethod(event.target.value)}>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARD">Card</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </Select>
            </Field>
            <Button
              type="button"
              className="self-end"
              disabled={busy}
              onClick={() => {
                if (!amount.trim()) {
                  setMessage("Enter an amount greater than zero.");
                  return;
                }
                if (
                  !window.confirm(
                    `Record ${formatMoney(amount, currency)} as ${method.replace(/_/g, " ").toLowerCase()}? This updates the invoice balance.`,
                  )
                ) {
                  return;
                }
                void recordPay();
              }}
            >
              Save payment
            </Button>
          </div>
        </div>
      ) : null}
      {share ? (
        <p className="text-sm text-muted">
          Link:{" "}
          <a className="font-medium text-accent underline-offset-2 hover:underline" href={share.viewUrl}>
            {share.viewUrl}
          </a>
          {type === "INVOICE" ? (paymentsHeld ? " · Record cash, bank, or mobile money on this invoice." : " · Customers can Pay Now on this link when a payment provider is configured.") : ""}
        </p>
      ) : null}
      {message ? (
        <Banner tone={/revoked|created/i.test(message) ? "neutral" : "danger"}>{message}</Banner>
      ) : null}
    </Card>
  );
}
