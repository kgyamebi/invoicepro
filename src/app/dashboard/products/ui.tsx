"use client";

import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";

export function ProductForm() {
  const router = useRouter();
  async function onSubmit(formData: FormData) {
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        sku: formData.get("sku"),
        sellingPrice: formData.get("sellingPrice"),
        unit: formData.get("unit") || "pcs",
        kind: formData.get("kind"),
        trackStock: formData.get("kind") === "PRODUCT",
        stockQuantity: formData.get("stockQuantity") || "0",
      }),
    });
    router.refresh();
  }
  return (
    <Card>
      <form action={onSubmit} className="grid gap-3 md:grid-cols-6">
        <Field label="Name"><Input name="name" required /></Field>
        <Field label="SKU"><Input name="sku" /></Field>
        <Field label="Price"><Input name="sellingPrice" required /></Field>
        <Field label="Type">
          <select name="kind" className="w-full rounded-lg border border-line px-3 py-2.5 text-sm">
            <option value="PRODUCT">Product</option>
            <option value="SERVICE">Service</option>
          </select>
        </Field>
        <Field label="Stock"><Input name="stockQuantity" /></Field>
        <Button type="submit" className="self-end">Add</Button>
      </form>
    </Card>
  );
}
