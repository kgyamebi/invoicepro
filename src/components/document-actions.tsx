"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";

export function DocumentActions({
  id,
  type,
  status,
  customerEmail,
}: {
  id: string;
  type: string;
  status: string;
  customerEmail?: string | null;
}) {
  const router = useRouter();
  const [share, setShare] = useState<{ viewUrl: string; whatsappUrl: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("MOBILE_MONEY");
  const [message, setMessage] = useState("");

  async function shareDoc(channel?: string) {
    const response = await fetch(`/api/documents/${id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel }),
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error || "Could not create a share link.");
      return;
    }
    setShare(json);
    if (channel !== "email") window.open(json.whatsappUrl, "_blank");
  }

  async function convertQuote() {
    const response = await fetch(`/api/quotations/${id}/convert-to-invoice`, { method: "POST" });
    const json = await response.json();
    if (response.ok) router.push(`/dashboard/invoices/${json.document.id}`);
    else setMessage(json.error);
  }

  async function recordPay() {
    const response = await fetch(`/api/invoices/${id}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, method }),
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error || "Could not record payment.");
      return;
    }
    router.refresh();
  }

  async function makeReceipt() {
    const response = await fetch(`/api/invoices/${id}/convert-to-receipt`, { method: "POST" });
    const json = await response.json();
    if (response.ok) router.push(`/dashboard/receipts/${json.document.id}`);
    else setMessage(json.error);
  }

  async function duplicate() {
    const response = await fetch(`/api/documents/${id}/duplicate`, { method: "POST" });
    const json = await response.json();
    if (response.ok) router.push(`/dashboard/invoices/${json.document.id}`);
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <a href={`/api/documents/${id}/pdf`} target="_blank">
          <Button type="button">Preview PDF</Button>
        </a>
        <Button type="button" variant="secondary" onClick={() => shareDoc()}>
          WhatsApp
        </Button>
        <Button type="button" variant="secondary" onClick={() => shareDoc("email")} disabled={!customerEmail}>
          Email
        </Button>
        <Button type="button" variant="ghost" onClick={duplicate}>
          Duplicate
        </Button>
        {type === "QUOTATION" ? (
          <Button type="button" onClick={convertQuote}>
            Convert to Invoice
          </Button>
        ) : null}
        {type === "INVOICE" ? (
          <Button type="button" variant="secondary" onClick={makeReceipt}>
            Create Receipt
          </Button>
        ) : null}
      </div>
      {type === "INVOICE" && status !== "paid" && status !== "cancelled" ? (
        <div className="grid gap-2 md:grid-cols-3">
          <Field label="Record payment">
            <Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" />
          </Field>
          <Field label="Method">
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm"
            >
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CARD">Card</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Button type="button" className="self-end" onClick={recordPay}>
            Save payment
          </Button>
        </div>
      ) : null}
      {share ? (
        <p className="text-sm text-muted">
          Link: <a className="underline" href={share.viewUrl}>{share.viewUrl}</a>
        </p>
      ) : null}
      {message ? <p className="text-sm text-danger">{message}</p> : null}
    </Card>
  );
}
