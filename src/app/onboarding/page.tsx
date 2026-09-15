"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Logo } from "@/components/brand";
import { Button, Card, Field, Input } from "@/components/ui";
import { BUSINESS_TYPES, COUNTRIES } from "@/lib/countries";
import { CURRENCIES } from "@/lib/money/currency";
import { TEMPLATES } from "@/lib/documents/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [country, setCountry] = useState("GH");
  const [error, setError] = useState("");
  const currency = useMemo(
    () => COUNTRIES.find((item) => item.code === country)?.defaultCurrency || "USD",
    [country],
  );

  async function onSubmit(formData: FormData) {
    setError("");
    const response = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        countryCode: formData.get("countryCode"),
        currencyCode: formData.get("currencyCode"),
        businessType: formData.get("businessType"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        addressLine1: formData.get("addressLine1"),
        website: formData.get("website"),
        taxId: formData.get("taxId"),
        preferredTemplate: formData.get("preferredTemplate"),
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error || "Could not save the business.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Logo />
      <Card className="mt-8">
        <h1 className="text-2xl font-semibold">Set up your business</h1>
        <form action={onSubmit} className="mt-6 grid gap-4">
          <Field label="Business name">
            <Input name="name" required placeholder="ABC Construction Ltd" />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Country">
              <select
                name="countryCode"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
              >
                {COUNTRIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Currency">
              <select
                name="currencyCode"
                defaultValue={currency}
                key={currency}
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
              >
                {Object.values(CURRENCIES).map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} · {item.symbol}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Business type">
            <select name="businessType" className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm">
              {BUSINESS_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field label="Phone">
            <Input name="phone" />
          </Field>
          <Field label="Business email">
            <Input name="email" type="email" />
          </Field>
          <Field label="Address">
            <Input name="addressLine1" />
          </Field>
          <Field label="Website">
            <Input name="website" />
          </Field>
          <Field label="Tax ID (optional)">
            <Input name="taxId" />
          </Field>
          <Field label="Document style">
            <select name="preferredTemplate" className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm">
              {TEMPLATES.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit">Go to dashboard</Button>
        </form>
      </Card>
    </div>
  );
}
