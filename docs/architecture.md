# Architecture

The product is a single Next.js application that serves marketing pages, the authenticated workspace, and the REST API under `/api`. That keeps hosting cost low. The API surface is namespaced so it can be extracted later.

## Tenancy

- A user owns or joins an **organization**.
- An organization has one or more **businesses**.
- Customers, products, documents, inventory and branding belong to a business.
- Server loaders always resolve `businessId` from the session. Guessing another business UUID returns 403.

## Document model

All commercial documents share `Document` + `DocumentItem`. `type` distinguishes invoice, quotation, receipt, estimate, proforma, credit note, purchase order, delivery note and statement.

## Money

`src/lib/money/calculate.ts` is the only source of totals. AI output is treated as draft line text and is recalculated before save.

## Payments

`PaymentService` selects configured adapters. Checkout never marks a subscription active. Webhooks verify signatures, store an idempotency key, then call the provider verify API before updating entitlements.
