import { flutterwaveProvider } from "./providers/flutterwave";
import { paystackProvider } from "./providers/paystack";
import { stripeProvider } from "./providers/stripe";
import type { CheckoutInput, PaymentMethodOption, PaymentProvider } from "./types";
import { verifyStripeSignature } from "./signature";

const PROVIDERS: PaymentProvider[] = [paystackProvider, stripeProvider, flutterwaveProvider];

export function listConfiguredProviders() {
  return PROVIDERS.filter((provider) => provider.isConfigured());
}

export function getProvider(key?: string) {
  const configured = listConfiguredProviders();
  if (key) {
    return configured.find((provider) => provider.key === key) ?? null;
  }
  return configured[0] ?? null;
}

export function detectPaymentMethods(input: {
  userCountry?: string | null;
  businessCountry?: string | null;
  currencyCode: string;
}): { provider: string; methods: PaymentMethodOption[] }[] {
  const country = input.businessCountry || input.userCountry || "US";
  return listConfiguredProviders()
    .map((provider) => ({
      provider: provider.key,
      methods: provider.availableMethods({
        countryCode: country,
        currencyCode: input.currencyCode,
      }),
    }))
    .filter((entry) => entry.methods.length > 0);
}

export async function createCheckout(providerKey: string | undefined, input: CheckoutInput) {
  const provider = getProvider(providerKey);
  if (!provider) {
    throw new Error("No payment provider is configured");
  }
  return provider.createCheckout(input);
}

export async function verifyPayment(providerKey: string, reference: string) {
  const provider = getProvider(providerKey);
  if (!provider) {
    throw new Error("Unknown payment provider");
  }
  return provider.verifyPayment(reference);
}

export async function handleWebhook(providerKey: string, rawBody: string, headers: Headers) {
  if (providerKey === "stripe") {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret || !verifyStripeSignature(rawBody, headers.get("stripe-signature"), secret)) {
      return null;
    }
  }
  const provider = getProvider(providerKey);
  if (!provider) return null;
  return provider.verifyWebhook(rawBody, headers);
}

export async function refundPayment(providerKey: string, reference: string, amount?: string) {
  const provider = getProvider(providerKey);
  if (!provider?.refundPayment) {
    throw new Error("Refunds are not available for this provider");
  }
  return provider.refundPayment(reference, amount);
}
