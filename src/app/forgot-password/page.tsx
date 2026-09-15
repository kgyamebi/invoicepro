"use client";

import { useState } from "react";
import { Logo } from "@/components/brand";
import { Button, Card, Field, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  async function onSubmit(formData: FormData) {
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.get("email") }),
    });
    setDone(true);
  }
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Logo />
      <Card className="mt-8">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        {done ? (
          <p className="mt-4 text-sm text-muted">If an account exists, we sent a reset link.</p>
        ) : (
          <form action={onSubmit} className="mt-6 space-y-4">
            <Field label="Email">
              <Input name="email" type="email" required />
            </Field>
            <Button type="submit" className="w-full">
              Send reset link
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
