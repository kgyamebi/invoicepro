# Payments

Adapters:

- `src/lib/payments/providers/stripe.ts`
- `src/lib/payments/providers/paystack.ts`
- `src/lib/payments/providers/flutterwave.ts`

A provider is unused until its secret key is present. UI copy never lists Mobile Money, M-Pesa, UPI or Pix unless that adapter reports the method for the merchant country.

Webhook routes:

- `POST /api/billing/webhook/stripe`
- `POST /api/billing/webhook/paystack`
- `POST /api/billing/webhook/flutterwave`
- `POST /api/payments/webhook?provider=paystack`

Failed or unsigned events do not activate a plan.
