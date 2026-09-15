# Invoice & Quotation SaaS

Professional invoices, quotations and receipts for small businesses — without expensive accounting software.

Working brand name: **InvoiceFlow**. The visible name is configurable through `APP_NAME` / `NEXT_PUBLIC_APP_NAME`.

## Overview

This is a multi-tenant document platform for freelancers, contractors, retailers and wholesalers. The core loop is:

Customer → product → quotation → acceptance → invoice → payment → receipt → history → reports.

Money is always calculated in application code with decimal-safe arithmetic. AI is optional and never used for totals.

## Architecture

- **Web + API:** Next.js App Router (`src/app`)
- **Database:** PostgreSQL + Prisma
- **Workers:** `worker/index.ts` for reminders, overdue status and recurring invoices
- **Payments:** provider adapters for Stripe, Paystack and Flutterwave
- **PDF:** `@react-pdf/renderer`

See `docs/` for deeper notes.

## Installation

```bash
npm install
copy .env.example .env
docker compose up -d database redis
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

The worker, in another terminal:

```bash
npm run worker
```

## Environment

Copy `.env.example`. Do not commit real secrets. Payment methods only appear for providers that have keys configured.

## Testing

```bash
npm test
npm run lint
npx playwright test
```

## Deployment

The frontend can run on Vercel. The same Next.js app can run on Railway, Render, Fly.io or similar. Use managed PostgreSQL (Neon, Supabase, RDS) and S3-compatible storage when you outgrow local disk.

`docker compose up --build` starts web, worker, Postgres and Redis.
