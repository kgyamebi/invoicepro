"use client";

import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { useState } from "react";

export function SettingsForm({
  business,
}: {
  business: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    website: string | null;
    addressLine1: string | null;
    taxId: string | null;
    invoicePrefix: string;
    quotationPrefix: string;
    receiptPrefix: string;
    defaultNotes: string | null;
    defaultTerms: string | null;
    paymentInstructions: string | null;
    reduceStockOn: string;
  };
}) {
  const [message, setMessage] = useState("");
  async function onSubmit(formData: FormData) {
    const response = await fetch(`/api/businesses/${business.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
    setMessage(response.ok ? "Saved." : "Could not save settings.");
  }
  return (
    <Card>
      <form action={onSubmit} className="grid gap-4 md:grid-cols-2">
        <Field label="Business name"><Input name="name" defaultValue={business.name} /></Field>
        <Field label="Phone"><Input name="phone" defaultValue={business.phone || ""} /></Field>
        <Field label="Email"><Input name="email" defaultValue={business.email || ""} /></Field>
        <Field label="Website"><Input name="website" defaultValue={business.website || ""} /></Field>
        <Field label="Address"><Input name="addressLine1" defaultValue={business.addressLine1 || ""} /></Field>
        <Field label="Tax ID"><Input name="taxId" defaultValue={business.taxId || ""} /></Field>
        <Field label="Invoice prefix"><Input name="invoicePrefix" defaultValue={business.invoicePrefix} /></Field>
        <Field label="Quotation prefix"><Input name="quotationPrefix" defaultValue={business.quotationPrefix} /></Field>
        <Field label="Receipt prefix"><Input name="receiptPrefix" defaultValue={business.receiptPrefix} /></Field>
        <Field label="Reduce stock on">
          <select name="reduceStockOn" defaultValue={business.reduceStockOn} className="w-full rounded-lg border border-line px-3 py-2.5 text-sm">
            <option value="INVOICE_CONFIRMED">Invoice created</option>
            <option value="INVOICE_PAID">Invoice paid</option>
            <option value="NEVER">Never</option>
          </select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Default notes"><Textarea name="defaultNotes" defaultValue={business.defaultNotes || ""} /></Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Default terms"><Textarea name="defaultTerms" defaultValue={business.defaultTerms || ""} /></Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Payment instructions"><Textarea name="paymentInstructions" defaultValue={business.paymentInstructions || ""} /></Field>
        </div>
        <Button type="submit">Save</Button>
        {message ? <p className="self-center text-sm text-muted">{message}</p> : null}
      </form>
    </Card>
  );
}
