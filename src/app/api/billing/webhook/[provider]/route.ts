import { handleWebhook, verifyPayment } from "@/lib/payments/service";
import { activateSubscription, recordProviderTransaction } from "@/server/billing";
import { prisma } from "@/server/db";
import { json } from "@/server/http";

export async function POST(request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const rawBody = await request.text();
  const event = await handleWebhook(provider, rawBody, request.headers);
  if (!event) {
    return json({ error: "Invalid webhook signature." }, 400);
  }
  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider, eventId: event.eventId } },
  });
  if (existing?.processedAt) {
    return json({ ok: true, duplicate: true });
  }
  await prisma.webhookEvent.upsert({
    where: { provider_eventId: { provider, eventId: event.eventId } },
    update: {},
    create: {
      provider,
      eventId: event.eventId,
      eventType: event.eventType,
      organizationId: event.organizationId,
    },
  });
  if (!event.paid) {
    return json({ ok: true, paid: false });
  }
  const verified = await verifyPayment(provider, event.providerRef);
  if (!verified.paid) {
    return json({ ok: true, paid: false });
  }
  const organizationId = event.organizationId || verified.metadata?.organizationId;
  if (!organizationId) {
    return json({ error: "Missing organization." }, 400);
  }
  await activateSubscription({
    organizationId,
    planKey: event.metadata?.planKey || verified.metadata?.planKey || "pro",
    interval: (event.metadata?.interval || verified.metadata?.interval || "MONTHLY") as
      | "MONTHLY"
      | "YEARLY"
      | "ONE_TIME",
    provider,
    providerRef: event.providerRef,
    creditAmount: event.metadata?.creditAmount ? Number(event.metadata.creditAmount) : undefined,
  });
  await recordProviderTransaction({
    organizationId,
    provider,
    providerRef: event.providerRef,
    type: "CHECKOUT",
    amount: verified.amount,
    currencyCode: verified.currencyCode,
    status: "paid",
    idempotencyKey: `${provider}:${event.eventId}`,
    rawPayload: { eventType: event.eventType },
  });
  await prisma.webhookEvent.update({
    where: { provider_eventId: { provider, eventId: event.eventId } },
    data: { processedAt: new Date(), organizationId },
  });
  return json({ ok: true });
}
