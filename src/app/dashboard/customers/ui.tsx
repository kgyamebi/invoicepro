"use client";

import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";

export function CustomerForm() {
  const router = useRouter();
  async function onSubmit(formData: FormData) {
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        company: formData.get("company"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        whatsapp: formData.get("whatsapp"),
      }),
    });
    router.refresh();
  }
  return (
    <Card>
      <form action={onSubmit} className="grid gap-3 md:grid-cols-5">
        <Field label="Name"><Input name="name" required /></Field>
        <Field label="Company"><Input name="company" /></Field>
        <Field label="Email"><Input name="email" type="email" /></Field>
        <Field label="Phone"><Input name="phone" /></Field>
        <Button type="submit" className="self-end">Add</Button>
      </form>
    </Card>
  );
}
