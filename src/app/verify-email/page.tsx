"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Card } from "@/components/ui";

function Verify() {
  const params = useSearchParams();
  const token = params.get("token");
  const [message, setMessage] = useState(token ? "Verifying…" : "Missing verification token.");
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const json = await response.json();
        if (!cancelled) {
          setMessage(response.ok ? "Email verified. You can close this page." : json.error);
        }
      })
      .catch(() => {
        if (!cancelled) setMessage("Something went wrong. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);
  return (
    <Card>
      <h1 className="text-2xl font-semibold">Verify email</h1>
      <p className="mt-4 text-muted">{message}</p>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Suspense>
        <Verify />
      </Suspense>
    </div>
  );
}
