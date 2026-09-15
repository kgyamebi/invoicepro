"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand";
import { Button, Card, Field, Input } from "@/components/ui";
import { COUNTRIES } from "@/lib/countries";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        countryCode: formData.get("countryCode"),
      }),
    });
    const json = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(json.error || "Could not create the account.");
      return;
    }
    router.push("/onboarding");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <Card>
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-2 text-sm text-muted">Then set up a business and create your first document.</p>
        <form action={onSubmit} className="mt-6 space-y-4">
          <Field label="Your name">
            <Input name="name" required />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" required />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" minLength={8} required />
          </Field>
          <Field label="Country">
            <select name="countryCode" className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm">
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </Field>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating…" : "Continue"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
