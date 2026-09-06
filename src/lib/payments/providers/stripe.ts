import type { CheckoutInput, PaymentProvider } from "../types";

function configured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export const stripeProvider: PaymentProvider = {
  key: "stripe",
  isConfigured: configured,
  supportedCountries() {
    return ["US", "GB", "CA", "AU", "DE", "FR", "AE", "ZA", "IN", "NG", "GH", "KE"];
  },
  availableMethods({ countryCode }) {
    if (!configured()) return [];
    const methods = [{ id: "card", label: "Pay with Card", channel: "card" }];
    if (countryCode === "IN") {
      methods.unshift({ id: "upi", label: "Pay with UPI", channel: "upi" });
    }
    return methods;
  },
  async createCheckout(input: CheckoutInput) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Stripe is not configured");
    const amount = Math.round(Number(input.amount) * 100);
    const body = new URLSearchParams({
      mode: input.interval === "ONE_TIME" ? "payment" : "subscription",
      success_url: `${input.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: input.cancelUrl,
      customer_email: input.email,
      "metadata[organizationId]": input.organizationId,
      "metadata[planKey]": input.planKey,
      "metadata[interval]": input.interval,
      "line_items[0][price_data][currency]": input.currencyCode.toLowerCase(),
      "line_items[0][price_data][product_data][name]": `${input.planKey} plan`,
      "line_items[0][price_data][unit_amount]": String(amount),
      "line_items[0][quantity]": "1",
    });
    if (input.interval !== "ONE_TIME") {
      body.set(
        "line_items[0][price_data][recurring][interval]",
        input.interval === "YEARLY" ? "year" : "month",
      );
    }
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const json = (await response.json()) as { id?: string; url?: string; error?: { message: string } };
    if (!response.ok || !json.id) {
      throw new Error(json.error?.message || "Unable to start Stripe checkout");
    }
    return { provider: "stripe", checkoutUrl: json.url, reference: json.id };
  },
  async verifyPayment(reference: string) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Stripe is not configured");
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${reference}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const json = (await response.json()) as {
      payment_status?: string;
      amount_total?: number;
      currency?: string;
      id: string;
      metadata?: Record<string, string>;
    };
    return {
      paid: json.payment_status === "paid",
      amount: ((json.amount_total ?? 0) / 100).toFixed(2),
      currencyCode: (json.currency ?? "usd").toUpperCase(),
      providerRef: json.id,
      metadata: json.metadata,
    };
  },
  async verifyWebhook(rawBody: string, headers: Headers) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return null;
    const signature = headers.get("stripe-signature");
    if (!signature) return null;
    const event = JSON.parse(rawBody) as {
      id: string;
      type: string;
      data: { object: { id: string; payment_status?: string; metadata?: Record<string, string> } };
    };
    const paid =
      event.type === "checkout.session.completed" &&
      event.data.object.payment_status === "paid";
    return {
      eventId: event.id,
      eventType: event.type,
      paid,
      providerRef: event.data.object.id,
      organizationId: event.data.object.metadata?.organizationId,
      metadata: event.data.object.metadata,
    };
  },
};
