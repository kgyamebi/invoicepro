"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, Card, Field, Input } from "@/components/ui";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  async function onSubmit(formData: FormData) {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.get("token"), password: formData.get("password") }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error || "Could not reset password.");
      return;
    }
    router.push("/login");
  }
  return (
    <Card>
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <form action={onSubmit} className="mt-6 space-y-4">
        <Field label="New password">
          <Input name="password" type="password" minLength={8} required />
        </Field>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="w-full">
          Update password
        </Button>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Suspense>
        <ResetForm />
      </Suspense>
    </div>
  );
}
