"use client";

import { Button } from "@/components/ui";
import { useState } from "react";

export function CheckoutButtons({ planKey }: { planKey: string }) {
  const [error, setError] = useState("");
  async function start(interval: "MONTHLY" | "YEARLY" | "ONE_TIME", creditAmount?: number) {
    setError("");
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planKey, interval, creditAmount }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error || "Checkout is unavailable.");
      return;
    }
    if (json.checkoutUrl) window.location.href = json.checkoutUrl;
  }
  if (planKey === "free") return null;
  return (
    <div className="mt-4 space-y-2">
      <Button type="button" onClick={() => start("MONTHLY")}>
        Upgrade
      </Button>
      {planKey === "starter" ? (
        <Button type="button" variant="secondary" onClick={() => start("ONE_TIME", 100)}>
          Buy 100 credits
        </Button>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
