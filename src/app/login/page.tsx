"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand";
import { Button, Card, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    const json = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(json.error || "Invalid email or password.");
      return;
    }
    router.push(json.needsOnboarding ? "/onboarding" : "/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <Card>
        <h1 className="text-2xl font-semibold">Log in</h1>
        <form action={onSubmit} className="mt-6 space-y-4">
          <Field label="Email">
            <Input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" required autoComplete="current-password" />
          </Field>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in…" : "Log in"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted">
          <Link href="/forgot-password">Forgot password</Link>
          {" · "}
          <Link href="/register">Create account</Link>
        </p>
      </Card>
    </div>
  );
}
