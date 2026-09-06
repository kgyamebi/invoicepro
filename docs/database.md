# Database

PostgreSQL is the production store. Prisma schema lives in `prisma/schema.prisma`.

Important indexes exist on `business_id`, `customer_id`, `document` status, `created_at` and `due_date`.

Usage is tracked per organization and calendar month. Credit packs decrement `credit_accounts` when a plan limit is exceeded.

Run:

```bash
npx prisma migrate dev
npx prisma db seed
```
