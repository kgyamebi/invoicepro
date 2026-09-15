"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Select, Skeleton, Textarea } from "@/components/ui";
import { CONSTRUCTION_CATEGORIES } from "@/lib/countries";
import { calculateDocument } from "@/lib/money/calculate";
import { formatMoney, getCurrency } from "@/lib/money/currency";
import { parseQuickEntry } from "@/lib/documents/quick-entry";
import { documentDashboardPath, type DocumentTypeKey } from "@/lib/documents/types";

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
  currency: initialCurrency,
  initial,
}: {
  type: DocumentTypeKey;
  documentId?: string;
  currency?: string;
  initial?: {
    customerId?: string;
    notes?: string;
    terms?: string;
    paymentTerms?: string;
    shippingAmount?: string;
    documentDiscountType?: "NONE" | "PERCENT" | "FIXED";
    documentDiscountValue?: string;
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
  const [terms, setTerms] = useState(initial?.terms || "");
  const [paymentTerms, setPaymentTerms] = useState(initial?.paymentTerms || "");
  const [docDiscountType, setDocDiscountType] = useState<"NONE" | "PERCENT" | "FIXED">(
    initial?.documentDiscountType || "NONE",
  );
  const [docDiscountValue, setDocDiscountValue] = useState(initial?.documentDiscountValue || "0");
  const [dueDate, setDueDate] = useState(initial?.dueDate || "");
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate || "");
  const [quick, setQuick] = useState("");
  const [currency, setCurrency] = useState(initialCurrency || "");
  const [error, setError] = useState("");
  const [limitHelp, setLimitHelp] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch("/api/customers"), fetch("/api/products"), fetch("/api/me")])
      .then(async ([c, p, me]) => {
        const customersJson = await c.json().catch(() => ({}));
        const productsJson = await p.json().catch(() => ({}));
        const meJson = await me.json().catch(() => ({}));
        if (cancelled) return;
        setCustomers(customersJson.customers || []);
        setProducts(
          (productsJson.products || []).map((item: { id: string; name: string; sellingPrice: unknown; unit: string }) => ({
            ...item,
            sellingPrice: String(item.sellingPrice),
          })),
        );
        setCurrency(meJson.businesses?.[0]?.currencyCode || initialCurrency || "");
        if (!c.ok || !p.ok) {
          setError("Some catalogue data could not be loaded. You can still type line items.");
        }
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Could not load the editor. Check your connection, then retry.");
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [initialCurrency]);

  const displayCurrency = currency || initialCurrency || "";
  const totals = useMemo(() => {
    const places = getCurrency(displayCurrency).decimalPlaces;
    return calculateDocument({
      lines: items.map((item) => ({
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        discountType: item.discountType,
        discountValue: item.discountValue,
        taxRate: item.taxRate,
      })),
      documentDiscountType: docDiscountType,
      documentDiscountValue: docDiscountValue || 0,
      shippingAmount: shipping || 0,
      decimalPlaces: places,
    });
  }, [items, shipping, displayCurrency, docDiscountType, docDiscountValue]);

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
    try {
      const response = await fetch("/api/ai/parse-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: quick }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.items) {
        setError(json.error || "Could not parse that text. Try the quick-entry format instead.");
        return;
      }
      setItems(
        json.items.map((item: { name: string; quantity: string; unitPrice?: string; category?: string }) => ({
          ...emptyItem(),
          name: item.name,
          quantity: item.quantity || "1",
          unitPrice: item.unitPrice || "0",
          category: item.category,
        })),
      );
    } catch {
      setError("Could not reach the parser. Check your connection and try again.");
    }
  }

  async function save() {
    if (saving) return;
    setError("");
    setLimitHelp(false);
    setSaving(true);
    try {
      const payload = {
        type,
        customerId: customerId || undefined,
        dueDate: dueDate || undefined,
        expiryDate: expiryDate || undefined,
        notes,
        terms,
        paymentTerms,
        shippingAmount: shipping,
        documentDiscountType: docDiscountType,
        documentDiscountValue: docDiscountValue,
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
      const json = await response.json().catch(() => ({}));
      if (response.status === 402) {
        setLimitHelp(true);
        setError(json.error || "Plan limit reached.");
        return;
      }
      if (!response.ok) {
        setError(json.error || "Could not save the document.");
        return;
      }
      router.push(documentDashboardPath(type, json.document.id));
    } catch {
      setError("Could not save the document. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const filteredProducts = products.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (!ready) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading editor">
        <Card className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </Card>
        <Card className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-24 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Who this is for</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Customer" hint="Choose from your saved customers">
            <Select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.company || customer.name}
                </option>
              ))}
            </Select>
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
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Add items quickly</p>
        <Field label="Quick item entry" hint="Example: 50 LED floodlights 180">
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
        <div className="mt-5">
          <Field label="Search products" hint="Prices fill in automatically from your catalogue">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search catalogue" />
          </Field>
        </div>
        {search ? (
          <div className="mt-2 divide-y divide-line overflow-hidden rounded-[10px] border border-line">
            {filteredProducts.slice(0, 6).map((product) => (
              <button
                key={product.id}
                type="button"
                className="flex w-full justify-between px-3 py-2.5 text-left text-sm transition hover:bg-bg-elevated"
                onClick={() => addProduct(product)}
              >
                <span>{product.name}</span>
                <span className="tabular-nums text-muted">{formatMoney(product.sellingPrice, displayCurrency)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </Card>

      <Card className="overflow-x-auto">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Line items</p>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              <th className="pb-3">Item</th>
              <th className="pb-3">Qty</th>
              <th className="pb-3">Price</th>
              <th className="pb-3">Disc %</th>
              <th className="pb-3">Tax %</th>
              <th className="pb-3"></th>
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
                    <Select
                      className="mt-1 text-xs"
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
                    </Select>
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
                    value={item.discountType === "PERCENT" || item.discountType === "FIXED" ? item.discountValue : item.discountValue}
                    placeholder="0"
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                discountType: event.target.value && event.target.value !== "0" ? "PERCENT" : "NONE",
                                discountValue: event.target.value || "0",
                              }
                            : row,
                        ),
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
                    className="mt-2 text-sm text-muted hover:text-danger"
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

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Terms</p>
          <Field label="Delivery / shipping">
            <Input value={shipping} onChange={(event) => setShipping(event.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Payment terms" hint="e.g. Net 14 — used as the invoice due date when converting a quote">
            <Input value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} />
          </Field>
          <Field label="Terms">
            <Textarea value={terms} onChange={(event) => setTerms(event.target.value)} rows={3} />
          </Field>
          <Field label="Notes">
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </Field>
          <Field label="Document discount %">
            <Input
              value={docDiscountType === "NONE" && docDiscountValue === "0" ? "" : docDiscountValue}
              placeholder="0"
              inputMode="decimal"
              onChange={(event) => {
                const value = event.target.value;
                setDocDiscountValue(value || "0");
                setDocDiscountType(value && value !== "0" ? "PERCENT" : "NONE");
              }}
            />
          </Field>
        </Card>
        <Card className="bg-gradient-to-br from-accent-soft/80 via-white to-white shadow-[var(--shadow-sm)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Financial summary</p>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="tabular-nums">{formatMoney(totals.subtotal, displayCurrency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Discount</span>
              <span className="tabular-nums">{formatMoney(totals.documentDiscountAmount, displayCurrency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Tax</span>
              <span className="tabular-nums">{formatMoney(totals.taxTotal, displayCurrency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Delivery</span>
              <span className="tabular-nums">{formatMoney(totals.shippingAmount, displayCurrency)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-xl font-semibold tracking-tight">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(totals.grandTotal, displayCurrency)}</span>
            </div>
          </div>
          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
          {limitHelp ? (
            <div className="mt-3">
              <Button type="button" onClick={() => router.push("/dashboard/billing")}>
                Upgrade to Solo
              </Button>
            </div>
          ) : null}
          <Button type="button" className="mt-5 w-full min-h-12" onClick={save} disabled={saving}>
            {saving ? "Saving…" : documentId ? "Save changes" : `Save ${type.toLowerCase()}`}
          </Button>
        </Card>
      </div>
    </div>
  );
}
