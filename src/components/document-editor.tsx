"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { CONSTRUCTION_CATEGORIES } from "@/lib/countries";
import { calculateDocument } from "@/lib/money/calculate";
import { formatMoney, getCurrency } from "@/lib/money/currency";
import { parseQuickEntry } from "@/lib/documents/quick-entry";
import type { DocumentTypeKey } from "@/lib/documents/types";

type Item = {
  productId?: string;
  name: string;
  category?: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountType: "NONE" | "PERCENT" | "FIXED";
  discountValue: string;
  taxRate: string;
};

const emptyItem = (): Item => ({
  name: "",
  quantity: "1",
  unit: "pcs",
  unitPrice: "0",
  discountType: "NONE",
  discountValue: "0",
  taxRate: "0",
});

export function DocumentEditor({
  type,
  documentId,
  initial,
}: {
  type: DocumentTypeKey;
  documentId?: string;
  initial?: {
    customerId?: string;
    notes?: string;
    paymentTerms?: string;
    shippingAmount?: string;
    expiryDate?: string;
    dueDate?: string;
    items?: Item[];
  };
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState<{ id: string; name: string; company?: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; sellingPrice: string; unit: string; stockQuantity?: string }[]>([]);
  const [customerId, setCustomerId] = useState(initial?.customerId || "");
  const [items, setItems] = useState<Item[]>(initial?.items?.length ? initial.items : [emptyItem()]);
  const [shipping, setShipping] = useState(initial?.shippingAmount || "0");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [paymentTerms, setPaymentTerms] = useState(initial?.paymentTerms || "");
  const [dueDate, setDueDate] = useState(initial?.dueDate || "");
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate || "");
  const [quick, setQuick] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState("");
  const [limitHelp, setLimitHelp] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/customers"), fetch("/api/products"), fetch("/api/me")]).then(
      async ([c, p, me]) => {
        const customersJson = await c.json();
        const productsJson = await p.json();
        const meJson = await me.json();
        setCustomers(customersJson.customers || []);
        setProducts(
          (productsJson.products || []).map((item: { id: string; name: string; sellingPrice: unknown; unit: string }) => ({
            ...item,
            sellingPrice: String(item.sellingPrice),
          })),
        );
        setCurrency(meJson.businesses?.[0]?.currencyCode || "USD");
      },
    );
  }, []);

  const totals = useMemo(() => {
    const places = getCurrency(currency).decimalPlaces;
    return calculateDocument({
      lines: items.map((item) => ({
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        discountType: item.discountType,
        discountValue: item.discountValue,
        taxRate: item.taxRate,
      })),
      shippingAmount: shipping || 0,
      decimalPlaces: places,
    });
  }, [items, shipping, currency]);

  function addProduct(product: (typeof products)[number]) {
    setItems((current) => [
      ...current.filter((item) => item.name),
      {
        ...emptyItem(),
        productId: product.id,
        name: product.name,
        unit: product.unit,
        unitPrice: product.sellingPrice,
      },
    ]);
    setSearch("");
  }

  function applyQuick() {
    const parsed = parseQuickEntry(quick);
    if (!parsed.length) return;
    setItems(
      parsed.map((item) => ({
        ...emptyItem(),
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice || "0",
      })),
    );
  }

  async function applyAi() {
    const response = await fetch("/api/ai/parse-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: quick }),
    });
    const json = await response.json();
    if (json.items) {
      setItems(
        json.items.map((item: { name: string; quantity: string; unitPrice?: string; category?: string }) => ({
          ...emptyItem(),
          name: item.name,
          quantity: item.quantity || "1",
          unitPrice: item.unitPrice || "0",
          category: item.category,
        })),
      );
    }
  }

  async function save() {
    setError("");
    setLimitHelp(false);
    const payload = {
      type,
      customerId: customerId || undefined,
      dueDate: dueDate || undefined,
      expiryDate: expiryDate || undefined,
      notes,
      paymentTerms,
      shippingAmount: shipping,
      items: items
        .filter((item) => item.name)
        .map((item) => ({
          ...item,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
    };
    const response = await fetch(documentId ? `/api/documents/${documentId}` : "/api/documents", {
      method: documentId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (response.status === 402) {
      setLimitHelp(true);
      setError(json.error);
      return;
    }
    if (!response.ok) {
      setError(json.error || "Could not save the document.");
      return;
    }
    const path =
      type === "QUOTATION"
        ? `/dashboard/quotations/${json.document.id}`
        : type === "RECEIPT"
          ? `/dashboard/receipts/${json.document.id}`
          : `/dashboard/invoices/${json.document.id}`;
    router.push(path);
  }

  const filteredProducts = products.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Customer">
            <select
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.company || customer.name}
                </option>
              ))}
            </select>
          </Field>
          {type === "INVOICE" ? (
            <Field label="Due date">
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </Field>
          ) : (
            <Field label="Valid until">
              <Input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
            </Field>
          )}
        </div>
      </Card>

      <Card>
        <Field label="Quick item entry">
          <Input
            value={quick}
            onChange={(event) => setQuick(event.target.value)}
            placeholder="50 LED floodlights 180"
          />
        </Field>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={applyQuick}>
            Add lines
          </Button>
          <Button type="button" variant="ghost" onClick={applyAi}>
            Parse with AI
          </Button>
        </div>
        <Field label="Search products">
          <Input className="mt-4" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalogue" />
        </Field>
        {search ? (
          <div className="mt-2 divide-y divide-line rounded-lg border border-line">
            {filteredProducts.slice(0, 6).map((product) => (
              <button
                key={product.id}
                type="button"
                className="flex w-full justify-between px-3 py-2 text-left text-sm"
                onClick={() => addProduct(product)}
              >
                <span>{product.name}</span>
                <span className="text-muted">{formatMoney(product.sellingPrice, currency)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </Card>

      <Card className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="pb-2">Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Tax %</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className="py-2 pr-2">
                  <Input
                    value={item.name}
                    placeholder="Description"
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, i) => (i === index ? { ...row, name: event.target.value } : row)),
                      )
                    }
                  />
                  {type === "QUOTATION" ? (
                    <select
                      className="mt-1 w-full rounded-lg border border-line px-2 py-1 text-xs"
                      value={item.category || ""}
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((row, i) => (i === index ? { ...row, category: event.target.value } : row)),
                        )
                      }
                    >
                      <option value="">Category</option>
                      {CONSTRUCTION_CATEGORIES.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  ) : null}
                </td>
                <td className="pr-2">
                  <Input
                    value={item.quantity}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, i) => (i === index ? { ...row, quantity: event.target.value } : row)),
                      )
                    }
                  />
                </td>
                <td className="pr-2">
                  <Input
                    value={item.unitPrice}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, i) => (i === index ? { ...row, unitPrice: event.target.value } : row)),
                      )
                    }
                  />
                </td>
                <td className="pr-2">
                  <Input
                    value={item.taxRate}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, i) => (i === index ? { ...row, taxRate: event.target.value } : row)),
                      )
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="text-muted"
                    onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button type="button" variant="ghost" className="mt-3" onClick={() => setItems((current) => [...current, emptyItem()])}>
          Add item
        </Button>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <Field label="Delivery / shipping">
            <Input value={shipping} onChange={(event) => setShipping(event.target.value)} />
          </Field>
          <Field label="Payment terms">
            <Input value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} />
          </Field>
          <Field label="Notes">
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
          </Field>
        </Card>
        <Card>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(totals.subtotal, currency)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{formatMoney(totals.taxTotal, currency)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{formatMoney(totals.shippingAmount, currency)}</span></div>
            <div className="flex justify-between border-t border-line pt-2 text-lg font-semibold">
              <span>Total</span>
              <span>{formatMoney(totals.grandTotal, currency)}</span>
            </div>
          </div>
          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
          {limitHelp ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" onClick={() => router.push("/dashboard/billing")}>Upgrade</Button>
              <Button type="button" variant="secondary" onClick={() => router.push("/dashboard/billing")}>Buy credits</Button>
            </div>
          ) : null}
          <Button type="button" className="mt-4 w-full" onClick={save}>
            Save {type.toLowerCase()}
          </Button>
        </Card>
      </div>
    </div>
  );
}
