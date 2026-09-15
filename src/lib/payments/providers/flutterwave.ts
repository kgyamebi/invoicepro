import type { CheckoutInput, PaymentProvider } from "../types";
import { verifyFlutterwaveSignature } from "../signature";

function configured() {
  return Boolean(process.env.FLUTTERWAVE_SECRET_KEY);
}

export const flutterwaveProvider: PaymentProvider = {
  key: "flutterwave",
  isConfigured: configured,
  supportedCountries() {
    return ["NG", "GH", "KE", "ZA", "UG", "TZ", "RW"];
  },
  availableMethods({ countryCode }) {
    if (!configured()) return [];
    const methods = [{ id: "card", label: "Pay with Card", channel: "card" }];
    if (countryCode === "GH") {
      methods.unshift({ id: "mobile_money", label: "Pay with Mobile Money", channel: "mobile_money" });
    }
    if (countryCode === "KE") {
      methods.unshift({ id: "mpesa", label: "Pay with M-Pesa", channel: "mpesa" });
    }
    return methods;
  },
  async createCheckout(input: CheckoutInput) {
    const key = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!key) throw new Error("Flutterwave is not configured");
    const reference = `flw_${input.organizationId.slice(0, 8)}_${Date.now()}`;
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount: Number(input.amount),
        currency: input.currencyCode,
        redirect_url: input.successUrl,
        customer: { email: input.email },
        meta: {
          organizationId: input.organizationId,
          planKey: input.planKey,
          interval: input.interval,
        },
        customizations: { title: `${input.planKey} plan` },
      }),
    });
    const json = (await response.json()) as {
      status: string;
      message?: string;
      data?: { link: string };
    };
    if (json.status !== "success" || !json.data?.link) {
      throw new Error(json.message || "Unable to start Flutterwave checkout");
    }
    return { provider: "flutterwave", checkoutUrl: json.data.link, reference };
  },
  async verifyPayment(reference: string) {
    const key = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!key) throw new Error("Flutterwave is not configured");
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${key}` } },
    );
    const json = (await response.json()) as {
      status: string;
      data?: {
        status: string;
        amount: number;
        currency: string;
        tx_ref: string;
        meta?: Record<string, string>;
      };
    };
    return {
      paid: json.status === "success" && json.data?.status === "successful",
      amount: Number(json.data?.amount ?? 0).toFixed(2),
      currencyCode: json.data?.currency ?? "USD",
      providerRef: json.data?.tx_ref ?? reference,
      metadata: json.data?.meta,
    };
  },
  async verifyWebhook(rawBody: string, headers: Headers) {
    const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    if (!secret) return null;
    if (!verifyFlutterwaveSignature(headers.get("verif-hash"), secret)) {
      return null;
    }
    const event = JSON.parse(rawBody) as {
      id?: string | number;
      event?: string;
      data?: {
        id: number;
        tx_ref: string;
        status: string;
        meta?: { organizationId?: string } & Record<string, string>;
      };
    };
    const data = event.data;
    if (!data) return null;
    return {
      eventId: String(data.id ?? event.id ?? data.tx_ref),
      eventType: event.event ?? "charge.completed",
      paid: data.status === "successful",
      providerRef: data.tx_ref,
      organizationId: data.meta?.organizationId,
      metadata: data.meta,
    };
  },
};
