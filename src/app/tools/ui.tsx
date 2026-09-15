"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Card, Field, Input } from "@/components/ui";
import { calculateDocument } from "@/lib/money/calculate";

export function Calculator({ mode }: { mode: "invoice" | "vat" | "discount" | "margin" | "payment" }) {
  const [qty, setQty] = useState("50");
  const [price, setPrice] = useState("180");
  const [tax, setTax] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [delivery, setDelivery] = useState("300");
  const [paid, setPaid] = useState("5000");
  const [cost, setCost] = useState("100");
  const [sell, setSell] = useState("180");

  const result = useMemo(() => {
    if (mode === "margin") {
      const c = Number(cost);
      const s = Number(sell);
      const profit = s - c;
      return {
        lines: [`Profit ${profit.toFixed(2)}`, `Margin ${s ? ((profit / s) * 100).toFixed(1) : 0}%`, `Markup ${c ? ((profit / c) * 100).toFixed(1) : 0}%`],
      };
    }
    const calc = calculateDocument({
      lines: [{ quantity: qty || 0, unitPrice: price || 0, taxRate: tax || 0, discountType: "PERCENT", discountValue: discount || 0 }],
      shippingAmount: mode === "vat" || mode === "discount" ? 0 : delivery || 0,
      amountPaid: mode === "payment" ? paid || 0 : 0,
      decimalPlaces: 2,
    });
    return {
      lines: [
        `Subtotal ${calc.subtotal}`,
        `Discount ${calc.itemDiscountTotal}`,
        `Tax ${calc.taxTotal}`,
        `Delivery ${calc.shippingAmount}`,
        `Total ${calc.grandTotal}`,
        mode === "payment" ? `Balance ${calc.balanceDue}` : "",
      ].filter(Boolean),
      total: calc.grandTotal,
    };
  }, [mode, qty, price, tax, discount, delivery, paid, cost, sell]);

  return (
    <Card className="mt-8 space-y-3">
      {mode === "margin" ? (
        <>
          <Field label="Cost"><Input value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
          <Field label="Selling price"><Input value={sell} onChange={(e) => setSell(e.target.value)} /></Field>
        </>
      ) : (
        <>
          <Field label="Quantity"><Input value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
          <Field label="Unit price"><Input value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
          {mode !== "discount" ? <Field label="Tax %"><Input value={tax} onChange={(e) => setTax(e.target.value)} /></Field> : null}
          <Field label="Discount %"><Input value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
          {mode === "invoice" || mode === "payment" ? (
            <Field label="Delivery"><Input value={delivery} onChange={(e) => setDelivery(e.target.value)} /></Field>
          ) : null}
          {mode === "payment" ? <Field label="Amount paid"><Input value={paid} onChange={(e) => setPaid(e.target.value)} /></Field> : null}
        </>
      )}
      <div className="space-y-1 text-sm">
        {result.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <Link href="/register">
        <Button>Create Quotation</Button>
      </Link>
    </Card>
  );
}
