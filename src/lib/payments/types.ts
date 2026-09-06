export type CheckoutInput = {
  organizationId: string;
  planKey: string;
  interval: "MONTHLY" | "YEARLY" | "ONE_TIME";
  currencyCode: string;
  amount: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  creditAmount?: number;
};

export type CheckoutResult = {
  provider: string;
  checkoutUrl?: string;
  clientSecret?: string;
  reference: string;
};

export type PaymentMethodOption = {
  id: string;
  label: string;
  channel: string;
};

export type PaymentProvider = {
  key: string;
  isConfigured(): boolean;
  supportedCountries(): string[];
  availableMethods(input: {
    countryCode: string;
    currencyCode: string;
  }): PaymentMethodOption[];
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  verifyPayment(reference: string): Promise<{
    paid: boolean;
    amount: string;
    currencyCode: string;
    providerRef: string;
    metadata?: Record<string, string>;
  }>;
  verifyWebhook(
    rawBody: string,
    headers: Headers,
  ): Promise<{
    eventId: string;
    eventType: string;
    paid: boolean;
    providerRef: string;
    organizationId?: string;
    metadata?: Record<string, string>;
  } | null>;
  refundPayment?(reference: string, amount?: string): Promise<void>;
  createSubscription?(input: CheckoutInput): Promise<CheckoutResult>;
  cancelSubscription?(providerSubscriptionId: string): Promise<void>;
};
