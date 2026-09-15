# Deployment

## Local

`docker compose up -d database redis` then `npm run dev`.

## Production

1. Provision PostgreSQL and Redis.
2. Set `APP_URL`, `AUTH_SECRET`, `DATABASE_URL`.
3. Add only the payment and email keys you will actually use.
4. Run `npx prisma migrate deploy && npx prisma db seed`.
5. Deploy the Next.js app.
6. Run `npm run worker` as a second process.

The app is provider-independent: Vercel + Neon + R2 is one shape; Railway + Postgres + S3 is another.
