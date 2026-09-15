import type { CheckoutInput, PaymentProvider } from "../types";
import { verifyPaystackSignature } from "../signature";

function configured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export const paystackProvider: PaymentProvider = {
  key: "paystack",
  isConfigured: configured,
  supportedCountries() {
    return ["NG", "GH", "ZA", "KE"];
  },
  availableMethods({ countryCode }) {
    if (!configured()) return [];
    const methods = [{ id: "card", label: "Pay with Card", channel: "card" }];
    if (countryCode === "GH") {
      methods.unshift({ id: "mobile_money", label: "Pay with Mobile Money", channel: "mobile_money" });
    }
    if (countryCode === "KE") {
      methods.unshift({ id: "mpesa", label: "Pay with M-Pesa", channel: "mobile_money" });
    }
    return methods;
  },
  async createCheckout(input: CheckoutInput) {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) throw new Error("Paystack is not configured");
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: Math.round(Number(input.amount) * 100),
        currency: input.currencyCode,
        callback_url: input.successUrl,
        metadata: {
          organizationId: input.organizationId,
          planKey: input.planKey,
          interval: input.interval,
          cancel_action: input.cancelUrl,
        },
      }),
    });
    const json = (await response.json()) as {
      status: boolean;
      message?: string;
      data?: { authorization_url: string; reference: string };
    };
    if (!json.status || !json.data) {
      throw new Error(json.message || "Unable to start Paystack checkout");
    }
    return {
      provider: "paystack",
      checkoutUrl: json.data.authorization_url,
      reference: json.data.reference,
    };
  },
  async verifyPayment(reference: string) {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) throw new Error("Paystack is not configured");
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const json = (await response.json()) as {
      status: boolean;
      data?: {
        status: string;
        amount: number;
        currency: string;
        reference: string;
        metadata?: Record<string, string>;
      };
    };
    return {
      paid: Boolean(json.status && json.data?.status === "success"),
      amount: ((json.data?.amount ?? 0) / 100).toFixed(2),
      currencyCode: json.data?.currency ?? "GHS",
      providerRef: json.data?.reference ?? reference,
      metadata: json.data?.metadata,
    };
  },
  async verifyWebhook(rawBody: string, headers: Headers) {
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return null;
    if (!verifyPaystackSignature(rawBody, headers.get("x-paystack-signature"), secret)) {
      return null;
    }
    const event = JSON.parse(rawBody) as {
      event: string;
      data: {
        id: number;
        reference: string;
        status: string;
        metadata?: { organizationId?: string } & Record<string, string>;
      };
    };
    return {
      eventId: String(event.data.id),
      eventType: event.event,
      paid: event.event === "charge.success" && event.data.status === "success",
      providerRef: event.data.reference,
      organizationId: event.data.metadata?.organizationId,
      metadata: event.data.metadata,
    };
  },
};
